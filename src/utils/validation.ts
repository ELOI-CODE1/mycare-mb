export interface SignupFormData {
    fullName: string
    email: string 
    password: string
    phone: string
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
    q1?: string
    q2?: string
}

//email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accept any reachable number: optional +, digits, spaces, dashes (7–15 digits).
export const isReachablePhone = (phone: string): boolean => {
    const digits = phone.trim().replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15
}

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
    } else if (data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.'
    }

    //Phone number
    if (!data.phone.trim()) {
        errors.phone = 'Phone number is required.'
    } else if (!isReachablePhone(data.phone)) {
        errors.phone = 'Enter a valid phone number.'
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

