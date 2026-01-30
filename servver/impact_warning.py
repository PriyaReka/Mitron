def generate_warning(crop, soil_status):
    """
    Generates impact warnings if nutrients are not applied.
    """
    warnings = []

    if soil_status.get("N_status") == "Low":
        warnings.append(
            f"If nitrogen is not applied, {crop} plants may grow slowly and yield may reduce."
        )

    if soil_status.get("P_status") == "Low":
        warnings.append(
            f"Low phosphorus can cause weak root growth and poor grain formation."
        )

    if soil_status.get("K_status") == "Low":
        warnings.append(
            f"Low potassium may reduce disease resistance and crop quality."
        )
        
    if not warnings:
        warnings.append("Maintain current nutrient levels for best yield.")

    return warnings
