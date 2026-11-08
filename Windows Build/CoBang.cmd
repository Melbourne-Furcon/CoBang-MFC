@echo off
setlocal
set "ROOT=%~dp0"
set "PATH=%ROOT%runtime\bin;%ROOT%runtime\lib;%PATH%"
set "GI_TYPELIB_PATH=%ROOT%runtime\lib\girepository-1.0"
set "GST_PLUGIN_PATH=%ROOT%runtime\lib\gstreamer-1.0"
set "GST_PLUGIN_SYSTEM_PATH=%ROOT%runtime\lib\gstreamer-1.0"
set "GTK_DATA_PREFIX=%ROOT%runtime"
set "GSETTINGS_SCHEMA_DIR=%ROOT%runtime\share\glib-2.0\schemas"
set "PYTHONPATH=%ROOT%app\share\cobang;%PYTHONPATH%"
set "PYTHONPATH=%ROOT%app\venv-packages;%ROOT%app\share\cobang;%PYTHONPATH%"
set "COBANG_INBOX_PUBKEY=%userprofile%\.ssh\cobang_inbox.pub"
set "G_MESSAGES_DEBUG=coban"
"%ROOT%runtime\bin\python3.exe" "%ROOT%app\bin\cobang" %*
