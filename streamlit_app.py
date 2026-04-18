import io

import cv2
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import rawpy
import streamlit as st
from PIL import Image
from scipy.stats import linregress
from streamlit_image_coordinates import streamlit_image_coordinates


st.set_page_config(page_title="Digital Colorimetry Tool", layout="wide")

st.title("Digital Colorimetry Tool")

uploaded_file = st.file_uploader(
    "Upload an image",
    type=["jpg", "jpeg", "cr2", "tif", "tiff", "png"],
    help="Supported formats: JPG, Canon CR2 RAW, TIFF, and PNG.",
)

table_placeholder = st.empty()
plot_placeholder = st.empty()
MAX_PREVIEW_WIDTH = 1400

if "standards_data" not in st.session_state:
    st.session_state.standards_data = {}

if "samples_data" not in st.session_state:
    st.session_state.samples_data = {}

if "last_click" not in st.session_state:
    st.session_state.last_click = None


def is_valid_point(entry: dict) -> bool:
    return entry.get("x") is not None and entry.get("y") is not None


def enrich_entry_with_measurement(
    image_bgr: np.ndarray, entry: dict, radius: int
) -> dict:
    enriched_entry = entry.copy()

    if not is_valid_point(enriched_entry):
        return enriched_entry

    measurement = get_circle_average(
        image_bgr,
        int(float(enriched_entry["x"])),
        int(float(enriched_entry["y"])),
        radius=radius,
    )
    enriched_entry.update(measurement)
    return enriched_entry


def load_image(file) -> np.ndarray:
    file_bytes = file.read()
    file.seek(0)

    if file.name.lower().endswith(".cr2"):
        with rawpy.imread(io.BytesIO(file_bytes)) as raw:
            return raw.postprocess()

    pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(pil_image)


def get_circle_average(
    image_bgr: np.ndarray, x: int, y: int, radius: int = 30
) -> dict[str, float]:
    mask = np.zeros(image_bgr.shape[:2], dtype=np.uint8)
    cv2.circle(mask, (x, y), radius, 255, -1)

    mean_bgr = cv2.mean(image_bgr, mask=mask)[:3]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    _, stddev = cv2.meanStdDev(gray, mask=mask)
    qc_variability = (stddev[0][0] / 127.5) * 100
    mean_bgr_array = np.array([[mean_bgr]], dtype=np.uint8)
    mean_hsv = cv2.cvtColor(mean_bgr_array, cv2.COLOR_BGR2HSV)[0, 0]
    mean_lab = cv2.cvtColor(mean_bgr_array, cv2.COLOR_BGR2Lab)[0, 0]

    return {
        "x": x,
        "y": y,
        "S": float(mean_hsv[1]),
        "L": float(mean_lab[0]),
        "a": float(mean_lab[1]),
        "b": float(mean_lab[2]),
        "QC Variability (%)": float(qc_variability),
    }


if uploaded_file is not None:
    rgb_image = load_image(uploaded_file)

    if rgb_image is not None:
        opencv_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
        image_height, image_width = opencv_image.shape[:2]
        preview_scale = min(MAX_PREVIEW_WIDTH / max(image_width, 1), 1.0)
        preview_width = max(int(image_width * preview_scale), 1)
        preview_height = max(int(image_height * preview_scale), 1)
        display_image = cv2.resize(
            opencv_image,
            (preview_width, preview_height),
            interpolation=cv2.INTER_AREA if preview_scale < 1.0 else cv2.INTER_LINEAR,
        )

        control_col_1, control_col_2, control_col_3, control_col_4 = st.columns(4)
        click_mode = control_col_1.radio(
            "Click Mode",
            ["Add Standard", "Add Sample"],
        )
        current_id = control_col_2.text_input(
            "ID",
            value="Std 1" if click_mode == "Add Standard" else "Sample A",
        ).strip()
        concentration_disabled = click_mode != "Add Standard"
        current_concentration = control_col_3.number_input(
            "Concentration",
            min_value=0.0,
            value=0.0,
            step=1.0,
            disabled=concentration_disabled,
        )
        sampling_diameter = control_col_4.number_input(
            "Sampling Diameter (px)",
            min_value=10,
            max_value=500,
            value=60,
            step=5,
        )
        sampling_radius = max(int(round(sampling_diameter / 2)), 1)

        for id_text, standard in st.session_state.standards_data.items():
            if not is_valid_point(standard):
                continue
            x = int(round(float(standard["x"]) * preview_scale))
            y = int(round(float(standard["y"]) * preview_scale))
            marker_radius = max(int(round(sampling_radius * preview_scale)), 8)
            line_thickness = max(int(round(2 * preview_scale)), 1)
            cv2.circle(
                display_image,
                (x, y),
                radius=marker_radius,
                color=(0, 0, 0),
                thickness=line_thickness,
            )
            cv2.putText(
                display_image,
                str(id_text),
                (x + marker_radius + 8, y + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                max(0.4, 0.6 * preview_scale),
                (0, 0, 0),
                line_thickness,
            )

        for id_text, sample in st.session_state.samples_data.items():
            if not is_valid_point(sample):
                continue
            x = int(round(float(sample["x"]) * preview_scale))
            y = int(round(float(sample["y"]) * preview_scale))
            marker_radius = max(int(round(sampling_radius * preview_scale)), 8)
            line_thickness = max(int(round(2 * preview_scale)), 1)
            cv2.circle(
                display_image,
                (x, y),
                radius=marker_radius,
                color=(0, 0, 0),
                thickness=line_thickness,
            )
            cv2.putText(
                display_image,
                str(id_text),
                (x + marker_radius + 8, y + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                max(0.4, 0.6 * preview_scale),
                (0, 0, 0),
                line_thickness,
            )

        display_image = cv2.cvtColor(display_image, cv2.COLOR_BGR2RGB)

        st.subheader("Click Image to Add Standards or Samples")
        value = streamlit_image_coordinates(
            display_image,
            key="image_click",
            width=preview_width,
        )

        if value is not None:
            original_x = min(
                max(int(round(value["x"] / max(preview_scale, 1e-9))), 0),
                image_width - 1,
            )
            original_y = min(
                max(int(round(value["y"] / max(preview_scale, 1e-9))), 0),
                image_height - 1,
            )
            click_signature = (original_x, original_y, click_mode, current_id)
            if current_id and st.session_state.last_click != click_signature:
                x_pct = (original_x / max(image_width - 1, 1)) * 100
                y_pct = (original_y / max(image_height - 1, 1)) * 100
                measurement = get_circle_average(
                    opencv_image,
                    original_x,
                    original_y,
                    radius=sampling_radius,
                )

                if click_mode == "Add Standard":
                    st.session_state.standards_data[current_id] = {
                        "ID": current_id,
                        "x": original_x,
                        "y": original_y,
                        "x_pct": float(x_pct),
                        "y_pct": float(y_pct),
                        "Concentration": float(current_concentration),
                        "Sampling Diameter (px)": sampling_diameter,
                        **measurement,
                    }
                else:
                    st.session_state.samples_data[current_id] = {
                        "ID": current_id,
                        "x": original_x,
                        "y": original_y,
                        "x_pct": float(x_pct),
                        "y_pct": float(y_pct),
                        "Sampling Diameter (px)": sampling_diameter,
                        **measurement,
                    }

                st.session_state.last_click = click_signature
                st.rerun()

        st.subheader("Edit Standards")
        stds_df = pd.DataFrame(
            [
                enrich_entry_with_measurement(opencv_image, entry, sampling_radius)
                for entry in st.session_state.standards_data.values()
            ],
            columns=[
                "ID",
                "x",
                "y",
                "x_pct",
                "y_pct",
                "Concentration",
                "Sampling Diameter (px)",
                "S",
                "L",
                "a",
                "b",
                "QC Variability (%)",
            ],
        )
        edited_stds = st.data_editor(stds_df, num_rows="dynamic", key="std_editor")

        st.subheader("Edit Samples")
        samples_df = pd.DataFrame(
            [
                enrich_entry_with_measurement(opencv_image, entry, sampling_radius)
                for entry in st.session_state.samples_data.values()
            ],
            columns=[
                "ID",
                "x",
                "y",
                "x_pct",
                "y_pct",
                "Sampling Diameter (px)",
                "S",
                "L",
                "a",
                "b",
                "QC Variability (%)",
            ],
        )
        edited_samples = st.data_editor(
            samples_df,
            num_rows="dynamic",
            key="samp_editor",
        )

        st.session_state.standards_data = {
            str(row["ID"]): {
                **row.to_dict(),
                "Sampling Diameter (px)": sampling_diameter,
            }
            for _, row in edited_stds.dropna(subset=["ID"]).iterrows()
            if pd.notna(row["x"]) and pd.notna(row["y"])
        }
        st.session_state.samples_data = {
            str(row["ID"]): {
                **row.to_dict(),
                "Sampling Diameter (px)": sampling_diameter,
            }
            for _, row in edited_samples.dropna(subset=["ID"]).iterrows()
            if pd.notna(row["x"]) and pd.notna(row["y"])
        }

        if st.button("Run Analysis"):
            cleaned_standards_df = edited_stds.dropna(
                subset=["ID", "Concentration", "b"]
            ).copy()
            cleaned_unknowns_df = edited_samples.dropna(subset=["ID", "b"]).copy()

            if len(cleaned_standards_df) < 2:
                st.error("Add at least two valid standards before running analysis.")
            else:
                standards_results_df = cleaned_standards_df.rename(
                    columns={
                        "ID": "Standard ID",
                        "x": "Pixel X",
                        "y": "Pixel Y",
                        "x_pct": "X (%)",
                        "y_pct": "Y (%)",
                        "S": "Average Saturation",
                        "L": "Average L",
                        "a": "Average a",
                        "b": "Average b",
                    }
                )
                table_placeholder.dataframe(standards_results_df, use_container_width=True)

                regression = linregress(
                    standards_results_df["Average b"],
                    standards_results_df["Concentration"],
                )
                sorted_standards_df = standards_results_df.sort_values("Average b")
                fitted_concentrations = (
                    regression.slope * sorted_standards_df["Average b"]
                    + regression.intercept
                )

                fig, ax = plt.subplots()
                ax.scatter(
                    standards_results_df["Average b"],
                    standards_results_df["Concentration"],
                    label="Standards",
                )
                ax.plot(
                    sorted_standards_df["Average b"],
                    fitted_concentrations,
                    color="tab:red",
                    label="Best Fit",
                )
                ax.set_xlabel("Average b (Blue Axis)")
                ax.set_ylabel("Concentration (%)")
                ax.set_title("Standard Curve")
                ax.legend()
                plot_placeholder.pyplot(fig)

                st.info(
                    f"Concentration = {regression.slope:.4f} * Average b + {regression.intercept:.4f} | "
                    f"R-squared = {regression.rvalue ** 2:.4f}"
                )

                st.divider()
                st.subheader("Unknown Sample Results")

                unknown_results_df = cleaned_unknowns_df.rename(
                    columns={
                        "ID": "Sample ID",
                        "x": "Pixel X",
                        "y": "Pixel Y",
                        "x_pct": "X (%)",
                        "y_pct": "Y (%)",
                        "S": "Average Saturation",
                        "L": "Average L",
                        "a": "Average a",
                        "b": "Average b",
                    }
                )
                unknown_results_df["Estimated Concentration"] = (
                    regression.slope * unknown_results_df["Average b"]
                    + regression.intercept
                )
                unknown_results_df["Estimated Concentration"] = (
                    unknown_results_df["Estimated Concentration"].clip(lower=0)
                )
                st.dataframe(unknown_results_df, use_container_width=True)
