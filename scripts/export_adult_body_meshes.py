"""Exports adult body meshes from Anny (https://github.com/naver/anny).

Anny's code is Apache-2.0 and its MakeHuman data is CC0. Only the default Anny
topology is used: its optional SMPL-X interoperability is non-commercial.

Adults only, by design: age never goes below ADULT_AGE, so this can't produce a
child's body. render_body_meshes.py turns the saved meshes into figures.

Run with scripts/export_adult_body_meshes.sh.
"""

import sys
from pathlib import Path

import anny
import numpy as np
import torch

ADULT_AGE = 0.75
FEMALE, MALE = 0.0, 1.0

# gender, weight, muscle
SHAPES = {
    "women-hourglass": (FEMALE, 0.50, 0.45),
    "women-pear": (FEMALE, 0.58, 0.35),
    "women-apple": (FEMALE, 0.72, 0.30),
    "women-rectangle": (FEMALE, 0.42, 0.45),
    "women-inverted_triangle": (FEMALE, 0.45, 0.65),
    "men-rectangle": (MALE, 0.50, 0.50),
    "men-triangle": (MALE, 0.62, 0.35),
    "men-inverted_triangle": (MALE, 0.48, 0.90),
    "men-oval": (MALE, 0.85, 0.30),
    "men-trapezoid": (MALE, 0.50, 0.72),
}


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    model = anny.Anny(local_changes="default").to(dtype=torch.float32)
    (out / "labels.txt").write_text(
        "PHENOTYPES\n"
        + "\n".join(map(str, model.phenotype_labels))
        + "\n\nLOCAL CHANGES\n"
        + "\n".join(map(str, model.local_change_labels))
        + "\n\nBONES\n"
        + "\n".join(map(str, model.bone_labels))
    )

    pose = torch.eye(4)[None, None].repeat(1, model.bone_count, 1, 1)
    faces = np.asarray(model.faces)
    for name, (gender, weight, muscle) in SHAPES.items():
        phenotype = {key: 0.5 for key in model.phenotype_labels}
        phenotype.update(age=ADULT_AGE, gender=gender, weight=weight, muscle=muscle)
        with torch.no_grad():
            output = model(pose_parameters=pose, phenotype_kwargs=phenotype)
        vertices = output["vertices"].squeeze(dim=0).numpy()
        np.savez_compressed(out / f"{name}.npz", vertices=vertices, faces=faces)
        print(name, vertices.shape, faces.shape)


if __name__ == "__main__":
    main()
