use thiserror::Error;

#[derive(Debug, Error)]
pub enum EngineError {
    #[error("catalog error: {0}")]
    Catalog(String),

    #[error("tweak not found: {0}")]
    TweakNotFound(String),

    #[error("preset not found: {0}")]
    PresetNotFound(String),

    #[error("script error: {0}")]
    Script(String),

    #[error("registry error: {0}")]
    Registry(String),

    #[error("session error: {0}")]
    Session(String),

    #[error("administrator privileges required — restart the app using 'Elevate for system changes'")]
    ElevationRequired,

    #[error("platform not supported: {0}")]
    Platform(String),

    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("yaml error: {0}")]
    Yaml(#[from] serde_yaml::Error),
}

impl serde::Serialize for EngineError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
