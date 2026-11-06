"""Renders the abstract body-shape figures used by the profile picker.

Children's figures always come from here. Adult figures can instead come from
real body meshes: see export_adult_body_meshes.py and render_body_meshes.py.

Each figure is a smooth 3D mannequin, ray-marched from a signed distance
field built from the measurements in SHAPES, with fine wire over one half of the
body and measurement bands on the other. Figures are deliberately featureless: no anatomical detail.

Usage (needs numpy and Pillow):
    python scripts/build_body_shape_figures.py frontend/public/images/body-shapes
"""

import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

WIDTH, HEIGHT = 440, 640
SUPERSAMPLE = 2
CANVAS_HEIGHT = 1.08  # scene units across the image height; a figure is 1 tall
GROUND_MARGIN = 0.05
MESH_SPACING = 0.0125
BODY_COLOR = np.array([246.0, 246.0, 247.0])
LIGHT = np.array([-0.45, 0.55, 0.70])
LIGHT = LIGHT / np.linalg.norm(LIGHT)


@dataclass(frozen=True)
class Build:
    """Proportions shared by a whole category, as fractions of body height."""

    crotch: float
    hip: float
    waist: float
    bust: float
    shoulder: float
    neck_base: float
    head_center: float
    head_radius: tuple[float, float]
    neck_radius: float
    arm_radius: float
    width_scale: float
    bust_depth: float
    yaw_degrees: float = 0.0


WOMAN = Build(0.470, 0.525, 0.625, 0.720, 0.815, 0.862, 0.932, (0.054, 0.068), 0.024, 0.027, 0.0052, 1.22)
MAN = Build(0.470, 0.520, 0.610, 0.725, 0.822, 0.866, 0.932, (0.056, 0.068), 0.032, 0.034, 0.0050, 1.05)
GIRL = Build(0.430, 0.480, 0.575, 0.660, 0.748, 0.792, 0.888, (0.072, 0.086), 0.029, 0.029, 0.0064, 1.0)
BOY = Build(0.430, 0.480, 0.570, 0.660, 0.752, 0.796, 0.888, (0.072, 0.086), 0.031, 0.031, 0.0064, 1.0)

# shoulder, bust, waist, hip (half-widths), and how far the belly projects.
SHAPES = {
    "women": (
        WOMAN,
        {
            "hourglass": (22, 22, 14, 23, 0.95),
            "pear": (18, 18, 15, 27, 1.00),
            "apple": (21, 24, 24, 21, 1.45),
            "rectangle": (20, 20, 18, 20, 1.00),
            "inverted_triangle": (26, 23, 17, 18, 0.95),
        },
    ),
    "men": (
        MAN,
        {
            "rectangle": (25, 24, 22, 22, 1.00),
            "triangle": (21, 22, 23, 26, 1.15),
            "inverted_triangle": (31, 28, 19, 20, 0.92),
            "oval": (24, 27, 30, 25, 1.50),
            "trapezoid": (28, 26, 21, 22, 0.98),
        },
    ),
    "girls": (
        GIRL,
        {
            "slim": (16, 15, 13, 15, 0.95),
            "regular": (18, 17, 16, 17, 1.00),
            "plus": (20, 21, 21, 21, 1.30),
        },
    ),
    "boys": (
        BOY,
        {
            "slim": (17, 15, 13, 14, 0.95),
            "regular": (19, 17, 16, 16, 1.00),
            "husky": (21, 21, 22, 20, 1.30),
        },
    ),
}


def smooth_table(ys, values, samples=512, blur=9):
    """Smooth lookup table through control points, sampled over 0..1."""
    grid = np.linspace(0, 1, samples)
    table = np.interp(grid, ys, values)
    kernel = np.exp(-0.5 * (np.arange(-3 * blur, 3 * blur + 1) / blur) ** 2)
    kernel /= kernel.sum()
    padded = np.pad(table, 3 * blur, mode="edge")
    return grid, np.convolve(padded, kernel, mode="valid")


def smooth_min(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def tapered_segment(p, start, end, r_start, r_end):
    axis = end - start
    t = np.clip(((p - start) @ axis) / (axis @ axis), 0, 1)
    closest = start + t[:, None] * axis
    return np.linalg.norm(p - closest, axis=1) - (r_start + (r_end - r_start) * t)


def ellipsoid(p, center, radii):
    q = (p - center) / radii
    k = np.linalg.norm(q, axis=1)
    return (k - 1) * radii.min()


class Body:
    def __init__(self, build: Build, shoulder, bust, waist, hip, belly):
        s = build.width_scale
        self.b = build
        yaw = np.radians(build.yaw_degrees)
        self.rotation = np.array(
            [[np.cos(yaw), 0, np.sin(yaw)], [0, 1, 0], [-np.sin(yaw), 0, np.cos(yaw)]]
        )
        self.sh, self.bu, self.wa, self.hi = shoulder * s, bust * s, waist * s, hip * s
        fullness = np.clip((self.wa + self.hi) / (2 * 0.095), 0.75, 1.45)

        ys = [build.crotch - 0.055, build.crotch - 0.015, build.hip, build.waist, build.bust,
              build.shoulder - 0.045, build.shoulder - 0.012, build.neck_base - 0.012,
              build.neck_base]
        widths = [self.hi * 0.50, self.hi * 0.88, self.hi, self.wa, self.bu,
                  (self.bu + self.sh) / 2, self.sh * 0.92, build.neck_radius * 1.9,
                  build.neck_radius * 1.1]
        depths = [self.hi * 0.30, self.hi * 0.52, self.hi * 0.64, self.wa * 0.72 * belly,
                  self.bu * 0.62 * build.bust_depth, self.sh * 0.44, self.sh * 0.30,
                  build.neck_radius * 1.3, build.neck_radius]
        self.grid, self.torso_w = smooth_table(ys, widths, blur=11)
        _, self.torso_d = smooth_table(ys, depths, blur=11)
        self.torso_range = (ys[0], ys[-1])

        thigh = self.hi * 0.50
        knee = max(0.030, thigh * 0.58)
        scale = build.crotch / 0.47
        # The thigh tapers away inside the pelvis, so it leaves no edge at the hip.
        leg_top = build.hip + 0.05
        leg_ys = [0.035, 0.09 * scale, 0.22 * scale, 0.29 * scale, build.crotch, build.hip, leg_top]
        leg_rs = [0.020, 0.024, knee * 1.16, knee * 0.94, thigh, thigh * 0.72, thigh * 0.18]
        self.ankle_cx = 0.052 + self.hi * 0.05
        knee_cx = 0.046 + self.hi * 0.16
        leg_cx = [self.ankle_cx, self.ankle_cx, knee_cx, knee_cx, self.hi * 0.50, self.hi * 0.46,
                  self.hi * 0.30]
        _, self.leg_r = smooth_table(leg_ys, leg_rs, blur=7)
        _, self.leg_cx = smooth_table(leg_ys, leg_cx, blur=7)
        self.leg_top = leg_top

        arm_length = build.shoulder * 0.42
        angle = np.radians(27)
        direction = np.array([np.sin(angle), -np.cos(angle), 0.0])
        self.arm_start = np.array([self.sh * 0.86, build.shoulder - 0.034, 0.0])
        self.elbow = self.arm_start + direction * arm_length * 0.5
        self.wrist = self.arm_start + direction * arm_length
        self.hand = self.wrist + direction * 0.065
        arm = build.arm_radius * fullness**0.8
        self.arm_radii = (arm * 0.95, arm * 0.74, arm * 0.54)

    def distance(self, p):
        b = self.b
        mirrored = p @ self.rotation
        mirrored[:, 0] = np.abs(mirrored[:, 0])
        x, y, z = mirrored[:, 0], mirrored[:, 1], mirrored[:, 2]

        w = np.interp(y, self.grid, self.torso_w)
        d = np.interp(y, self.grid, self.torso_d)
        ring = np.sqrt((x / w) ** 2 + (z / d) ** 2)
        torso = (ring - 1) * np.minimum(w, d)
        torso = np.maximum(torso, np.maximum(self.torso_range[0] - y, y - self.torso_range[1]))

        r = np.interp(y, self.grid, self.leg_r)
        cx = np.interp(y, self.grid, self.leg_cx)
        leg = np.sqrt((x - cx) ** 2 + z**2) - r
        leg = np.maximum(leg, np.maximum(0.03 - y, y - self.leg_top))
        foot = ellipsoid(
            mirrored,
            np.array([self.ankle_cx + 0.008, 0.019, 0.034]),
            np.array([0.026, 0.019, 0.072]),
        )

        upper = tapered_segment(mirrored, self.arm_start, self.elbow, *self.arm_radii[:2])
        lower = tapered_segment(mirrored, self.elbow, self.wrist, *self.arm_radii[1:])
        hand = tapered_segment(mirrored, self.wrist, self.hand, self.arm_radii[2], 0.012)

        neck = tapered_segment(
            mirrored,
            np.array([0.0, b.neck_base - 0.02, 0.0]),
            np.array([0.0, b.head_center - 0.03, 0.0]),
            b.neck_radius,
            b.neck_radius * 0.92,
        )
        head = ellipsoid(
            mirrored,
            np.array([0.0, b.head_center, 0.006]),
            np.array([b.head_radius[0], b.head_radius[1], b.head_radius[0] * 1.08]),
        )

        body = smooth_min(torso, leg, 0.035)
        body = smooth_min(body, foot, 0.016)
        arms = smooth_min(smooth_min(upper, lower, 0.012), hand, 0.008)
        body = smooth_min(body, arms, 0.012)
        return smooth_min(smooth_min(body, neck, 0.03), head, 0.012)


def trace(body: Body, width: int, height: int):
    """Orthographic rays along -z. Returns hit points and the hit mask."""
    scale = CANVAS_HEIGHT / height
    xs = (np.arange(width) + 0.5 - width / 2) * scale
    ys = (height - np.arange(height) - 0.5) * scale - GROUND_MARGIN
    gx, gy = np.meshgrid(xs, ys)
    points = np.stack([gx.ravel(), gy.ravel(), np.full(gx.size, 0.35)], axis=1)
    active = np.arange(points.shape[0])
    hit = np.zeros(points.shape[0], dtype=bool)

    for _ in range(90):
        if active.size == 0:
            break
        d = body.distance(points[active])
        done = d < 0.0006
        hit[active[done]] = True
        moving = active[~done]
        points[moving, 2] -= d[~done] * 0.65
        active = moving[points[moving, 2] > -0.35]
    return points, hit, gx.shape


def shade(body: Body, points):
    e = 0.0012
    offsets = np.array([[1, -1, -1], [-1, -1, 1], [-1, 1, -1], [1, 1, 1]], dtype=float)
    normal = np.zeros_like(points)
    for offset in offsets:
        normal += offset * body.distance(points + offset * e)[:, None]
    normal /= np.linalg.norm(normal, axis=1, keepdims=True)

    diffuse = np.clip(normal @ LIGHT, 0, 1)
    occlusion = np.clip(body.distance(points + normal * 0.02) / 0.02, 0.2, 1)
    light = (0.74 + 0.26 * diffuse) * (0.86 + 0.14 * occlusion)
    rim = np.clip(1 - normal[:, 2], 0, 1) ** 3
    color = BODY_COLOR[None, :] * light[:, None] * (1 - 0.24 * rim[:, None])

    x, y, z = points.T
    wire = np.zeros(points.shape[0], dtype=bool)

    # Left half: a fine grid wrapped over the surface.
    around = x + 0.6 * z
    for family in (y, around):
        phase = np.abs(family / MESH_SPACING - np.round(family / MESH_SPACING))
        wire |= phase < 0.07
    wire &= x < 0

    # Right half: measurement bands at the chest, waist, hips and thighs.
    b = body.b
    on_trunk = (x >= 0) & (x < body.sh * 1.05)
    for height in (b.bust, b.waist, b.hip, b.crotch - 0.07, b.crotch - 0.21):
        wire |= on_trunk & (np.abs(y - height) < 0.0011)

    wire |= (np.abs(x) < 0.0011) & (y > b.crotch)  # centre seam
    return color * (1 - 0.14 * wire[:, None])


def ground_shadow(body: Body, width: int, height: int) -> Image.Image:
    scale = CANVAS_HEIGHT / height
    xs = (np.arange(width) + 0.5 - width / 2) * scale
    ys = (height - np.arange(height) - 0.5) * scale - GROUND_MARGIN
    gx, gy = np.meshgrid(xs, ys)
    spread = body.hi * 0.60 + 0.10
    shape = (gx / spread) ** 2 + ((gy + 0.003) / 0.018) ** 2
    alpha = np.clip(1 - shape, 0, 1) * 95
    return Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))


def render(body: Body) -> Image.Image:
    width, height = WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE
    points, hit, shape = trace(body, width, height)
    rgba = np.zeros((points.shape[0], 4))
    rgba[hit, :3] = shade(body, points[hit])
    rgba[hit, 3] = 255
    figure = Image.fromarray(np.clip(rgba, 0, 255).reshape(*shape, 4).astype(np.uint8))

    canvas = Image.new("RGBA", (width, height), (60, 62, 75, 0))
    canvas.putalpha(ground_shadow(body, width, height))
    canvas.alpha_composite(figure)
    return canvas.resize((WIDTH, HEIGHT), Image.LANCZOS)


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for category, (build, shapes) in SHAPES.items():
        for name, measurements in shapes.items():
            render(Body(build, *measurements)).save(
                out / f"{category}-{name}.webp", quality=88, method=6
            )
            print(f"{category}-{name}")


if __name__ == "__main__":
    main()
