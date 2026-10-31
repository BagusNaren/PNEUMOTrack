import joblib
import tensorflow as tf

from predictor import predict_new_audio

MODEL_DIR = "deployment_v3"

print("Loading models...")

config = joblib.load(f"{MODEL_DIR}/config_v3.pkl")

feat_scaler = joblib.load(f"{MODEL_DIR}/scaler_feat_v3.pkl")
latent_scaler = joblib.load(f"{MODEL_DIR}/scaler_latent_v3.pkl")
svm = joblib.load(f"{MODEL_DIR}/ocsvm_full_v3.pkl")

encoder = tf.keras.models.load_model(
    f"{MODEL_DIR}/encoder_v3.h5",
    compile=False
)

autoencoder = tf.keras.models.load_model(
    f"{MODEL_DIR}/autoencoder_full_v3.h5",
    compile=False
)

print("Models loaded")


def predictor(audio_path):

    return predict_new_audio(
        filepath=audio_path,
        encoder_model=encoder,
        svm_model=svm,
        feat_scaler=feat_scaler,
        latent_scaler=latent_scaler,
        ae_model=autoencoder,
        ae_threshold=float(config["ae_threshold"]),
        sr=config.get("sample_rate", 22050),
        verbose=False
    )
