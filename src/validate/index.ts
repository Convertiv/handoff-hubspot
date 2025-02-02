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
    if (!property.rules) {
        errors.push({ message: "Field rules are required", attribute: "rules", property: key });
    } else {
        if (!property.rules.required) {
            errors.push({ message: "Field rules.required is required", attribute: "rules.required", property: key });
        }
        if (property.rules.content) {
            if (property.rules.content.min && !Number.isInteger(property.rules.content.min)) {
                errors.push({ message: "Field rules.content.min must be an integer", attribute: "rules.content.min", property: key });
            }
            if (property.rules.content.max && !Number.isInteger(property.rules.content.max)) {
                errors.push({ message: "Field rules.content.max must be an integer", attribute: "rules.content.max", property: key });
            }
        }
        if (property.type === "text" || property.type === "array") {
            if (!property.rules.content) {
                errors.push({ message: "Field rules.content is required for text fields", attribute: "rules.content", property: key });
            }
        }
        if (property.type === "image") {
            if (!property.rules.dimensions) {
                errors.push({ message: "Field rules.dimensions are required for image fields", attribute: "rules.dimensions", property: key });
            } else {
                if (!property.rules.dimensions.min) {
                    errors.push({ message: "Field rules.dimensions.min is required for image fields", attribute: "rules.dimensions.min", property: key });
                } else {
                    if (!property.rules.dimensions.width) {
                        errors.push({ message: "Field rules.dimensions.width is required for image fields", attribute: "rules.dimensions.width", property: key });
                    }
                    if (!property.rules.dimensions.height) {
                        errors.push({ message: "Field rules.dimensions.height is required for image fields", attribute: "rules.dimensions.height", property: key });
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
    console.log(component);
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