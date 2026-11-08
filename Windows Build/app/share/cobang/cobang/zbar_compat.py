"""zbar_compat.py

Tiny stand-in for the parts of the `zbar` module (python3-zbar) that CoBang uses:
ImageScanner().scan(Image(w, h, 'Y800', data)) -> count, Image.symbols, Symbol.type / Symbol.data.

Used where python3-zbar is not available (Windows). Backends, tried in order:
  * pyzbar    (pip install pyzbar; needs the zbar DLL, bundled in its Windows wheels)
  * zxingcpp  (pip install zxing-cpp; self-contained wheels)
"""

from __future__ import annotations

from dataclasses import dataclass, field

from PIL import Image as PILImage


try:
    from pyzbar import pyzbar as _pyzbar
except Exception:  # ImportError, or the zbar DLL could not be loaded
    _pyzbar = None
try:
    import zxingcpp as _zxing
except Exception:
    _zxing = None


@dataclass
class Symbol:
    type: str
    data: str


class SymbolSet(list):
    pass


@dataclass
class Image:
    width: int
    height: int
    fmt: str
    data: bytes
    symbols: SymbolSet = field(default_factory=SymbolSet)


class ImageScanner:
    def scan(self, img: Image) -> int:
        if img.fmt != 'Y800':
            raise ValueError('Only Y800 (8-bit grayscale) images are supported')
        pil = PILImage.frombytes('L', (img.width, img.height), img.data)
        found = SymbolSet()
        if _pyzbar is not None:
            for r in _pyzbar.decode(pil):
                found.append(Symbol(type=r.type, data=r.data.decode('utf-8', errors='replace')))
        elif _zxing is not None:
            for r in _zxing.read_barcodes(pil):
                found.append(Symbol(type=r.format.name, data=r.text))
        else:
            raise RuntimeError('No barcode backend found. Install pyzbar or zxing-cpp.')
        img.symbols = found
        return len(found)
