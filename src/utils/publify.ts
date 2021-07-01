import _ from "lodash";

const publify = async (user: object, fields: Array<string>): Promise<any> => {
    return await _.pick(user, [...fields]);
};
export { publify };