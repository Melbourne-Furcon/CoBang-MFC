"""Platform helpers so the same code base runs on Linux and Windows."""

import sys


IS_WINDOWS = sys.platform == 'win32'

try:
    # On Linux (and most POSIX builds) this is bound to the C library's gettext.
    from locale import gettext  # noqa: F401
except ImportError:  # Windows builds of Python don't ship locale.gettext
    from gettext import gettext  # noqa: F401
