use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::Deserialize;
use walkdir::WalkDir;

use super::catalog::TweakCatalog;
use super::error::EngineError;
use super::models::{Preset, PresetSummary};
use super::paths;

#[derive(Debug, Clone)]
pub struct PresetCatalog {
    presets: HashMap<String, Preset>,
}

#[derive(Debug, Deserialize)]
struct PresetFile {
    presets: Vec<PresetDefinition>,
}

#[derive(Debug, Deserialize)]
struct PresetDefinition {
    id: String,
    name: String,
    description: String,
    #[serde(rename = "targetUser")]
    target_user: String,
    #[serde(rename = "tweakIds")]
    tweak_ids: Vec<String>,
}

impl PresetCatalog {
    pub fn load_from_dir(presets_dir: &Path, catalog: &TweakCatalog) -> Result<Self, EngineError> {
        let mut presets = HashMap::new();

        for entry in WalkDir::new(presets_dir)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.path().extension().is_some_and(|ext| ext == "yaml" || ext == "yml"))
        {
            let content = fs::read_to_string(entry.path())?;
            let file: PresetFile = serde_yaml::from_str(&content)?;
            for def in file.presets {
                for id in &def.tweak_ids {
                    catalog.get(id)?;
                }
                let summary = summarize(&def.tweak_ids, catalog);
                presets.insert(
                    def.id.clone(),
                    Preset {
                        id: def.id,
                        name: def.name,
                        description: def.description,
                        target_user: def.target_user,
                        tweak_ids: def.tweak_ids,
                        summary,
                    },
                );
            }
        }

        Ok(Self { presets })
    }

    pub fn all(&self) -> Vec<Preset> {
        let mut list: Vec<_> = self.presets.values().cloned().collect();
        list.sort_by(|a, b| a.name.cmp(&b.name));
        list
    }

    pub fn get(&self, id: &str) -> Result<Preset, EngineError> {
        self.presets
            .get(id)
            .cloned()
            .ok_or_else(|| EngineError::PresetNotFound(id.to_string()))
    }
}

pub fn load_presets(
    app: &tauri::AppHandle,
    catalog: &TweakCatalog,
) -> Result<PresetCatalog, EngineError> {
    let dir = paths::presets_dir(app);
    PresetCatalog::load_from_dir(&dir, catalog)
}

fn summarize(tweak_ids: &[String], catalog: &TweakCatalog) -> PresetSummary {
    let mut summary = PresetSummary {
        apps: 0,
        services: 0,
        privacy: 0,
        ui: 0,
        cleanup: 0,
        windows_update: 0,
        tasks: 0,
        total: tweak_ids.len() as u32,
    };

    for id in tweak_ids {
        if let Ok(tweak) = catalog.get(id) {
            match tweak.category.as_str() {
                "apps" => summary.apps += 1,
                "services" => summary.services += 1,
                "privacy" => summary.privacy += 1,
                "ui" => summary.ui += 1,
                "cleanup" => summary.cleanup += 1,
                "windows_update" => summary.windows_update += 1,
                "tasks" => summary.tasks += 1,
                _ => {}
            }
        }
    }

    summary
}
