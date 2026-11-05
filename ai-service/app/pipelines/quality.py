"""
Quality and safety gates around every try-on model.

Input gate (before spending a model call): both images must decode, be
large enough to work with, and have a plausible shape. A rejected input is
the caller's problem, not a transient failure — the endpoint answers 422
and the backend fails the job without retrying, showing the reason.

Output gate (before a result is stored): the generated image must decode,
be large enough, not be blank/flat, and actually differ from the person
photo (a no-op "result" is a model failure). A rejected output makes the
router fall back to the next model instead of showing it.

Content safety is a pluggable SafetyChecker. The default allows
everything; plug in a classifier (or a provider's safety flag) by passing
one to the router. Hosted models usually run their own safety checker.
"""

from dataclasses import dataclass
from io import BytesIO
from typing import Protocol

from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError

MIN_INPUT_SIDE = 256
MAX_INPUT_ASPECT = 3.0
MIN_OUTPUT_SIDE = 256
# Per-channel standard deviation below this is a flat/blank image.
MIN_OUTPUT_STDDEV = 6.0
# Mean absolute pixel difference (0-255) below this means the model
# returned the person photo unchanged.
MIN_OUTPUT_CHANGE = 2.0


class InputRejected(ValueError):
    """The inputs can't produce a try-on; the message is shown to the shopper."""


class OutputRejected(ValueError):
    """A model produced an unusable result; try the next model."""


@dataclass(frozen=True)
class InputImages:
    person: Image.Image
    garment: Image.Image


def decode(data: bytes, what: str) -> Image.Image:
    try:
        image = Image.open(BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise InputRejected(f"The {what} isn't a readable image.") from exc
    return (ImageOps.exif_transpose(image) or image).convert("RGB")


def check_inputs(person_bytes: bytes, garment_bytes: bytes) -> InputImages:
    person = decode(person_bytes, "photo")
    garment = decode(garment_bytes, "garment image")
    for image, what in ((person, "photo"), (garment, "garment image")):
        width, height = image.size
        if min(width, height) < MIN_INPUT_SIDE:
            raise InputRejected(
                f"The {what} is too small ({width}x{height}). "
                f"Use one at least {MIN_INPUT_SIDE} pixels on each side."
            )
        if max(width, height) / min(width, height) > MAX_INPUT_ASPECT:
            raise InputRejected(f"The {what} is too narrow or too wide — crop it closer.")
    return InputImages(person=person, garment=garment)


def check_output(result: Image.Image, person: Image.Image) -> None:
    width, height = result.size
    if min(width, height) < MIN_OUTPUT_SIDE:
        raise OutputRejected(f"result too small ({width}x{height})")
    if max(ImageStat.Stat(result).stddev) < MIN_OUTPUT_STDDEV:
        raise OutputRejected("result is blank")
    reference = ImageOps.fit(person, result.size)
    diff = ImageStat.Stat(_difference(result, reference)).mean
    if sum(diff) / len(diff) < MIN_OUTPUT_CHANGE:
        raise OutputRejected("result is unchanged from the person photo")


def _difference(a: Image.Image, b: Image.Image) -> Image.Image:
    from PIL import ImageChops

    return ImageChops.difference(a.convert("RGB"), b.convert("RGB"))


class SafetyChecker(Protocol):
    def is_safe(self, image: Image.Image) -> bool: ...


class AllowAllSafetyChecker:
    def is_safe(self, image: Image.Image) -> bool:
        return True
