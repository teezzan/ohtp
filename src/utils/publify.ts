import _ from "lodash";

let publify = async (user: object, fields: Array<string>) => {
    return await _.pick(user, [...fields]);
}
export { publify };