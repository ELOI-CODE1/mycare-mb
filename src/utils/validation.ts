export interface SignupFormData {
    fullName: string
    email: string 
    password: string
    phone: string
    location: string
}

export interface AnswersData {
    q1?: string
    q2?: string
}

export interface FormErrors {
    fullName?: string
    email?: string
    password?: string 
    phone?: string
    location?: string
    q1?: string
    q2?: string
}

//email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//phone regex
const PHONE_REGEX = /^(?:\+250|250|0)?7[2389]\d{7}$/;

export const validateStepOne = (data: SignupFormData): { isValid: boolean; errors: FormErrors}  => {
    const errors: FormErrors = {}

    //name
    if (!data.fullName.trim()) {
        errors.fullName = 'Full name is required.'
    } else if (data.fullName.trim().length < 3) {
        errors.fullName = 'Name must be at least 3 characters long.'
    }

    //email
    if (!data.email.trim()) {
        errors.email = 'Email address is required.'
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
        errors.email = 'Please enter a valid email address.'
    }

    //password
    if (!data.password) {
        errors.password = 'Password is required.'
    } else if (data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.'
    }

    //Phone number
    if (!data.phone.trim()) {
        errors.phone = 'Phone number is required.'
    } else if (!PHONE_REGEX.test(data.phone.trim().replace(/\s+/g, ''))) {
        errors.phone = 'Enter a valid phone number.'
    }

    if (!data.location.trim()) {
        errors.location = 'Your staying location is required.'
    }

    return{
        isValid: Object.keys(errors).length === 0,
        errors,
    }

}

export const validateStepTwo = (answers: AnswersData): {isValid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {}

    if (!answers.q1) {
        errors.q1 = 'Please select who you are registering for.'
    }

    if (!answers.q2) {
        errors.q2 = 'Please select your gender.'
    }

    return{
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

