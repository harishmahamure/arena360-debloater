use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::Deserialize;
use walkdir::WalkDir;

use super::error::EngineError;
use super::models::Tweak;
use super::paths;

#[derive(Debug, Clone)]
pub struct TweakCatalog {
    tweaks: HashMap<String, Tweak>,
}

#[derive(Debug, Deserialize)]
struct TweakFile {
    tweaks: Vec<Tweak>,
}

impl TweakCatalog {
    pub fn load_from_dir(
        tweaks_dir: &Path,
        scripts_exist: impl Fn(&str) -> bool,
    ) -> Result<Self, EngineError> {
        if !tweaks_dir.exists() {
            return Err(EngineError::Catalog(format!(
                "tweaks directory not found: {}",
                tweaks_dir.display()
            )));
        }

        let mut tweaks = HashMap::new();

        for entry in WalkDir::new(tweaks_dir)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.path().extension().is_some_and(|ext| ext == "yaml" || ext == "yml"))
        {
            let content = fs::read_to_string(entry.path())?;
            let file: TweakFile = serde_yaml::from_str(&content)?;
            for tweak in file.tweaks {
                if tweaks.contains_key(&tweak.id) {
                    return Err(EngineError::Catalog(format!(
                        "duplicate tweak id: {}",
                        tweak.id
                    )));
                }
                for script in [
                    &tweak.detect_script,
                    &tweak.apply_script,
                    &tweak.revert_script,
                ] {
                    if !scripts_exist(script) {
                        return Err(EngineError::Catalog(format!(
                            "missing script for tweak {}: {script}",
                            tweak.id
                        )));
                    }
                }
                tweaks.insert(tweak.id.clone(), tweak);
            }
        }

        if tweaks.is_empty() {
            return Err(EngineError::Catalog("no tweaks loaded".into()));
        }

        Ok(Self { tweaks })
    }

    pub fn all(&self) -> Vec<Tweak> {
        let mut list: Vec<_> = self.tweaks.values().cloned().collect();
        list.sort_by(|a, b| a.name.cmp(&b.name));
        list
    }

    pub fn by_category(&self, category: &str) -> Vec<Tweak> {
        self.all()
            .into_iter()
            .filter(|t| t.category == category)
            .collect()
    }

    pub fn get(&self, id: &str) -> Result<Tweak, EngineError> {
        self.tweaks
            .get(id)
            .cloned()
            .ok_or_else(|| EngineError::TweakNotFound(id.to_string()))
    }

    pub fn get_many(&self, ids: &[String]) -> Result<Vec<Tweak>, EngineError> {
        ids.iter().map(|id| self.get(id)).collect()
    }

    pub fn count(&self) -> usize {
        self.tweaks.len()
    }
}

pub fn load_catalog(app: &tauri::AppHandle) -> Result<TweakCatalog, EngineError> {
    let dir = paths::tweaks_dir(app);
    TweakCatalog::load_from_dir(&dir, |script| paths::script_exists(app, script))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_catalog_from_resources() {
        let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/tweaks");
        let scripts_root = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/scripts");
        let catalog = TweakCatalog::load_from_dir(&dir, |script| {
            scripts_root.join(script.trim_start_matches("scripts/")).exists()
        })
        .expect("catalog should load");

        assert!(catalog.count() > 0);
    }
}
