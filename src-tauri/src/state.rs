use std::collections::HashMap;
use std::sync::Mutex;

use crate::engine::models::ResourceEntry;
use crate::engine::models::InstalledApp;
use crate::engine::{PresetCatalog, TweakCatalog};

pub struct AppState {
    pub inner: Mutex<AppStateInner>,
}

pub struct AppStateInner {
    pub catalog: TweakCatalog,
    pub presets: PresetCatalog,
    pub current_session: Option<String>,
    pub resource_entries: HashMap<String, ResourceEntry>,
    pub installed_apps: HashMap<String, InstalledApp>,
}

impl AppState {
    pub fn new(catalog: TweakCatalog, presets: PresetCatalog) -> Self {
        Self {
            inner: Mutex::new(AppStateInner {
                catalog,
                presets,
                current_session: None,
                resource_entries: HashMap::new(),
                installed_apps: HashMap::new(),
            }),
        }
    }
}
