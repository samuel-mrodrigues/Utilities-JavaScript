/**
 * Modify a object with the template you defined and copies all the keys from the target object
 * @param {{*}} template - The template that will be returned
 * @param {{}} objectTarget - The object that will be copied to the corresponding keys in the template
 */
export function extractFromObject(template, objectTarget) {
    for (const key in template) {
        if (objectTarget.hasOwnProperty(key)) {
            if (typeof template[key] === 'object') {
                if (Array.isArray(template[key])) {

                    const newArray = []

                    if (template[key].length != 0) {
                        const itemArrayTemplate = template[key][0];
                        if (Array.isArray(objectTarget[key]) && objectTarget[key].length != 0) {
                            for (const itemTarget of objectTarget[key].filter(item => typeof item === typeof itemArrayTemplate)) {
                                let newValue;
                                if (typeof itemArrayTemplate === 'object') {
                                    newValue = JSON.parse(JSON.stringify(itemArrayTemplate))
                                    extractFromObject(newValue, itemTarget);
                                } else {
                                    newValue = itemTarget;
                                }
                                newArray.push(newValue);
                            }
                        }
                    }

                    template[key] = newArray;
                } else {
                    extractFromObject(template[key], objectTarget[key]);
                }
            } else {
                template[key] = objectTarget[key];
            }
        } else {
            if (typeof template[key] === 'object') {
                if (Array.isArray(template[key])) {
                    template[key] = [];
                }
            }
        }
    }
}