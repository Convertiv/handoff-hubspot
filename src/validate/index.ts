import { HandoffComponent, FieldTypes, PropertyDefinition } from "../fields/types";

export interface FieldValidation { message: string, attribute: string }[]

const validateField = (
    property: PropertyDefinition,
    key: string
): FieldValidation[] => {
    let errors = [];
    if (!property.type) {
        errors.push({ message: "Field type is required", attribute: "type" });
    } else if (FieldTypes.indexOf(property.type) === -1) {
        errors.push({ message: `Field type ${property.type} is invalid`, attribute: "type", property: key });
    }
    if (!property.description) {
        errors.push({ message: "Field description is required", attribute: "description", property: key });
    }
    if (!property.name) {
        errors.push({ message: "Field name is required", attribute: "name", property: key });
    }
    if (!property.default) {
        errors.push({ message: "Field default is required", attribute: "default", property: key });
    }

    if (!property.rules) {
        errors.push({ message: "Field rules are required", attribute: "rules", property: key });
    } else {
        if (!property.rules.required) {
            errors.push({ message: "Field rules.required is required", attribute: "rules.required", property: key });
        }
        if (property.rules.content) {
            if (!property.rules.content.min) {
                errors.push({ message: "Content rules must have a minimum length", attribute: "rules.content.min", property: key });
            }
            if (!property.rules.content.max) {
                errors.push({ message: "Content rules must have a maximum length", attribute: "rules.content.min", property: key });
            }

        }
        if (property.type === "text") {
            if (!property.rules.content) {
                errors.push({ message: "Content rules are required for text fields", attribute: "rules.content", property: key });
            }
        }
        if (property.type === "array") {
            if (!property.rules.content) {
                errors.push({ message: "Content rules are required for text fields", attribute: "rules.content", property: key });
            } else {
                if (!property.rules.content.min) {
                    errors.push({ message: "Content rules must have a minimum length", attribute: "rules.content.min", property: key });
                } else if (property.rules.content.min < 1) {
                    errors.push({ message: "Content rules minimum length must be greater than 0", attribute: "rules.content.min", property: key });
                }
                if (!property.rules.content.max) {
                    errors.push({ message: "Content rules must have a maximum length", attribute: "rules.content.min", property: key });
                } else if (property.rules.content.max < 1) {
                    errors.push({ message: "Content rules maximum length must be greater than 0", attribute: "rules.content.max", property: key });
                }
            }
            if (!property.items) {
                errors.push({ message: "Items are required for array fields", attribute: "items", property: key });
            } else {
                if (!property.items.type) {
                    errors.push({ message: "Type is required for array fields", attribute: "items.type", property: key });
                } else if (FieldTypes.indexOf(property.items.type) === -1) {
                    errors.push({ message: `Field type ${property.items.type} is invalid`, attribute: "items.type", property: key });
                }
                if (!property.items.properties) {
                    errors.push({ message: "Properties are required for array fields", attribute: "items.properties", property: key });
                } else {
                    for (let key in property.items.properties) {
                        errors = errors.concat(validateField(property.items.properties[key], key));
                    }
                }
            }
        }
        if (property.type === "image") {
            if (!property.rules.dimensions) {
                errors.push({ message: "Dimensions are required for image fields", attribute: "rules.dimensions", property: key });
            } else {
                if (!property.rules.dimensions.min) {
                    errors.push({ message: "Minimum is required for image fields", attribute: "rules.dimensions.min", property: key });
                } else {
                    if (!property.rules.dimensions.min.width) {
                        errors.push({ message: "Minimum width is required for image fields", attribute: "rules.dimensions.width", property: key });
                    }
                    if (!property.rules.dimensions.min.height) {
                        errors.push({ message: "Minimum height is required for image fields", attribute: "rules.dimensions.height", property: key });
                    }
                }
            }
        }
    }

    return errors;
}

const validateModule = (
    component: HandoffComponent
): FieldValidation[] => {
    let errors = [];
    if (!component.code) {
        errors.push({ message: "Component code is required", attribute: "code" });
    }
    if (!component.title) {
        errors.push({ message: "Component title is required", attribute: "title" });
    }
    if (!component.properties) {
        errors.push({ message: "Component properties are required", attribute: "properties" });
    } else {
        for (let key in component.properties) {
            errors = errors.concat(validateField(component.properties[key], key));
        }
    }
    return errors;
}

export default validateModule;