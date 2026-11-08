#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "Microsoft::DirectX-Headers" for configuration "Release"
set_property(TARGET Microsoft::DirectX-Headers APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(Microsoft::DirectX-Headers PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libDirectX-Headers.a"
  )

list(APPEND _cmake_import_check_targets Microsoft::DirectX-Headers )
list(APPEND _cmake_import_check_files_for_Microsoft::DirectX-Headers "${_IMPORT_PREFIX}/lib/libDirectX-Headers.a" )

# Import target "Microsoft::DirectX-Guids" for configuration "Release"
set_property(TARGET Microsoft::DirectX-Guids APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(Microsoft::DirectX-Guids PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libDirectX-Guids.a"
  )

list(APPEND _cmake_import_check_targets Microsoft::DirectX-Guids )
list(APPEND _cmake_import_check_files_for_Microsoft::DirectX-Guids "${_IMPORT_PREFIX}/lib/libDirectX-Guids.a" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
