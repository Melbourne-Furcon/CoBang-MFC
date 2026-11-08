/*
 * Copyright (C) 2020 Purism SPC
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

#pragma once

#if !defined(_ADWAITA_INSIDE) && !defined(ADWAITA_COMPILATION)
#error "Only <adwaita.h> can be included directly."
#endif

#include "adw-version.h"

#include <glib-object.h>

G_BEGIN_DECLS

#define ADW_TYPE_ENUM_LIST_ITEM (adw_enum_list_item_get_type())

ADW_DEPRECATED_IN_1_10_FOR(GtkEnumListItem)
G_DECLARE_FINAL_TYPE (AdwEnumListItem, adw_enum_list_item, ADW, ENUM_LIST_ITEM, GObject)

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_item_get_value)
int adw_enum_list_item_get_value (AdwEnumListItem *self);

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_item_get_name)
const char *adw_enum_list_item_get_name (AdwEnumListItem *self);

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_item_get_nick)
const char *adw_enum_list_item_get_nick (AdwEnumListItem *self);

#define ADW_TYPE_ENUM_LIST_MODEL (adw_enum_list_model_get_type())

ADW_DEPRECATED_IN_1_10_FOR(GtkEnumList)
G_DECLARE_FINAL_TYPE (AdwEnumListModel, adw_enum_list_model, ADW, ENUM_LIST_MODEL, GObject)

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_new)
AdwEnumListModel *adw_enum_list_model_new (GType enum_type) G_GNUC_WARN_UNUSED_RESULT;

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_get_enum_type)
GType adw_enum_list_model_get_enum_type (AdwEnumListModel *self);

ADW_DEPRECATED_IN_1_10_FOR(gtk_enum_list_find)
guint adw_enum_list_model_find_position (AdwEnumListModel *self,
                                         int               value);

G_END_DECLS
