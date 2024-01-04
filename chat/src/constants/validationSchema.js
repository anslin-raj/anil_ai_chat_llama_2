import * as yup from "yup";
import {
    USERNAME_REQUIRED_ERROR,
    PASSWORD_REQUIRED_ERROR,
    PASSWORDS_MUST_MATCH,
    FIELD_REQUIRED,
    ONLY_LOWERCASE_LETTERS,
    NO_SPACES,
    NEW_USER_PASSWORD_FORMAT,
    PASSWORD,
} from "./Constants";

export const LOGIN_SCHEMA = yup.object().shape({
    username: yup.string().required(USERNAME_REQUIRED_ERROR).trim(),
    password: yup.string().required(PASSWORD_REQUIRED_ERROR).trim(),
});

export const RegisterUserSchema = yup.object().shape({
    name: yup.string().required(FIELD_REQUIRED).trim(),
    user_name: yup
        .string()
        .required(FIELD_REQUIRED)
        .matches(/^[a-z\s]*$/, ONLY_LOWERCASE_LETTERS)
        .matches(/^[a-z]*$/, NO_SPACES),
    password: yup
        .string()
        .required(FIELD_REQUIRED)
        .matches(
            /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            NEW_USER_PASSWORD_FORMAT
        ),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref(PASSWORD), null], PASSWORDS_MUST_MATCH),
});
