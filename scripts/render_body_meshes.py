"""Renders body meshes exported by export_adult_body_meshes.py into figures.

The same look as build_body_shape_figures.py: a white body, the real mesh edges
over its left half, measurement bands on its right half. Plain numpy and Pillow.

Usage: python scripts/render_body_meshes.py MESH_DIR frontend/public/images/body-shapes
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

WIDTH, HEIGHT = 440, 640
SUPERSAMPLE = 2
LIGHT = np.array([-0.45, 0.55, 0.70])
LIGHT = LIGHT / np.linalg.norm(LIGHT)
BODY_COLOR = np.array([246.0, 246.0, 247.0])
LINE_COLOR = (150, 150, 156, 120)
# Heights of the measurement bands, as a fraction of body height.
BANDS = (0.72, 0.62, 0.525, 0.40, 0.26)


def upright(vertices):
    """Puts the tallest axis on y, feet at 0, the body 1 tall and centred."""
    spans = vertices.max(axis=0) - vertices.min(axis=0)
    up = int(np.argmax(spans))
    if up == 2:  # z-up, as Anny exports: turn it to y-up facing +z
        vertices = vertices[:, [0, 2, 1]] * np.array([1.0, 1.0, -1.0])
    vertices = vertices - np.array([0, vertices[:, 1].min(), 0])
    vertices = vertices / vertices[:, 1].max()
    centre = (vertices.max(axis=0) + vertices.min(axis=0)) / 2
    return vertices - np.array([centre[0], 0, centre[2]])


def triangles(faces):
    if faces.shape[1] == 3:
        return faces
    return np.concatenate([faces[:, [0, 1, 2]], faces[:, [0, 2, 3]]])


def vertex_normals(vertices, tris):
    a, b, c = vertices[tris[:, 0]], vertices[tris[:, 1]], vertices[tris[:, 2]]
    face_normals = np.cross(b - a, c - a)
    normals = np.zeros_like(vertices)
    for corner in range(3):
        np.add.at(normals, tris[:, corner], face_normals)
    return normals / np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)


def rasterize(screen, normals, tris, width, height):
    """Z-buffers the triangles, interpolating normals. Returns a normal map."""
    depth = np.full((height, width), -np.inf)
    image = np.zeros((height, width, 3))
    for tri in tris:
        p = screen[tri]
        x0, x1 = int(max(p[:, 0].min(), 0)), int(min(p[:, 0].max() + 1, width - 1))
        y0, y1 = int(max(p[:, 1].min(), 0)), int(min(p[:, 1].max() + 1, height - 1))
        if x1 < x0 or y1 < y0:
            continue
        area = (p[1, 0] - p[0, 0]) * (p[2, 1] - p[0, 1]) - (p[2, 0] - p[0, 0]) * (p[1, 1] - p[0, 1])
        if abs(area) < 1e-9:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        w0 = ((p[1, 0] - xs) * (p[2, 1] - ys) - (p[2, 0] - xs) * (p[1, 1] - ys)) / area
        w1 = ((p[2, 0] - xs) * (p[0, 1] - ys) - (p[0, 0] - xs) * (p[2, 1] - ys)) / area
        w2 = 1 - w0 - w1
        inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
        z = w0 * p[0, 2] + w1 * p[1, 2] + w2 * p[2, 2]
        region = depth[y0 : y1 + 1, x0 : x1 + 1]
        update = inside & (z > region)
        if update.any():
            region[update] = z[update]
            n = normals[tri]
            image[y0 : y1 + 1, x0 : x1 + 1][update] = (
                w0[update, None] * n[0] + w1[update, None] * n[1] + w2[update, None] * n[2]
            )
    return image, depth


def render(vertices, faces):
    width, height = WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE
    vertices = upright(vertices)
    tris = triangles(faces)
    normals = vertex_normals(vertices, tris)

    scale = height / 1.08
    screen = np.stack(
        [
            width / 2 + vertices[:, 0] * scale,
            height - (vertices[:, 1] + 0.04) * scale,
            vertices[:, 2] * scale,
        ],
        axis=1,
    )
    normal_map, depth = rasterize(screen, normals, tris, width, height)
    covered = np.isfinite(depth)
    # Winding differs between exports; visible surfaces must face the camera.
    if normal_map[covered, 2].mean() < 0:
        normal_map = -normal_map
    n = normal_map / np.maximum(np.linalg.norm(normal_map, axis=2, keepdims=True), 1e-9)

    diffuse = np.clip(n @ LIGHT, 0, 1)
    rim = np.clip(1 - n[..., 2], 0, 1) ** 3
    light = (0.74 + 0.26 * diffuse) * (1 - 0.24 * rim)
    rgba = np.zeros((height, width, 4))
    rgba[..., :3] = BODY_COLOR * light[..., None]
    rgba[..., 3] = covered * 255
    figure = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8))
    figure = draw_lines(figure, screen, faces, depth, scale)

    canvas = Image.new("RGBA", (width, height), (60, 62, 75, 0))
    canvas.putalpha(ground_shadow(width, height, scale))
    canvas.alpha_composite(figure)
    return canvas.resize((WIDTH, HEIGHT), Image.LANCZOS)


def draw_lines(figure, screen, faces, depth, scale):
    """Real mesh edges on the left half, measurement bands on the right."""
    overlay = Image.new("RGBA", figure.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    height, width = depth.shape
    centre = width / 2
    for face in faces:
        for a, b in zip(face, np.roll(face, -1)):
            mid = (screen[a] + screen[b]) / 2
            x, y = int(mid[0]), int(mid[1])
            on_left = mid[0] <= centre
            if on_left and 0 <= x < width and 0 <= y < height and mid[2] >= depth[y, x] - 6:
                draw.line([tuple(screen[a, :2]), tuple(screen[b, :2])], fill=LINE_COLOR, width=1)
    trunk = 0.17 * scale
    for band in BANDS:
        row = height - (band + 0.04) * scale
        draw.line([(centre, row), (centre + trunk, row)], fill=LINE_COLOR, width=1)
    draw.line([(centre, 0), (centre, height - 0.47 * scale)], fill=LINE_COLOR, width=1)

    alpha = np.array(figure)[..., 3]
    clipped = np.array(overlay)
    clipped[..., 3] = np.where(alpha > 0, clipped[..., 3], 0)
    figure.alpha_composite(Image.fromarray(clipped))
    return figure


def ground_shadow(width, height, scale):
    gx, gy = np.meshgrid(np.arange(width) - width / 2, np.arange(height) - (height - 0.04 * scale))
    shape = (gx / (0.20 * scale)) ** 2 + (gy / (0.018 * scale)) ** 2
    alpha = np.clip(1 - shape, 0, 1) * 95
    return Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))


def main():
    source, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for path in sorted(source.glob("*.npz")):
        data = np.load(path)
        render(data["vertices"].astype(float), data["faces"]).save(
            out / f"{path.stem}.webp", quality=88, method=6
        )
        print(path.stem)


if __name__ == "__main__":
    main()
