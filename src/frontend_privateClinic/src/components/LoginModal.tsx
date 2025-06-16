import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const loginSchema = yup.object({
    email: yup
        .string()
        .required('Email is required')
        .email('Please enter a valid email'),
    password: yup
        .string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
}).required();

type LoginFormInputs = yup.InferType<typeof loginSchema>;

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: yupResolver(loginSchema)
    });

    const onSubmit = (data: LoginFormInputs) => {
        console.log(data);
        // Handle login logic here
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-2xl font-normal text-center mb-6">
                                    Log in
                                </Dialog.Title>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-normal text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Type your email"
                                        />
                                        {errors.email && (
                                            <span className="text-red-500 text-xs">{errors.email.message}</span>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-normal text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                {...register('password')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Type your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <span className="text-red-500 text-xs">{errors.password.message}</span>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#1250B1] text-white py-2 rounded-md hover:bg-opacity-90 transition-colors"
                                    >
                                        Sign In
                                    </button>

                                    <div className="flex justify-between items-center text-sm">
                                        <a href="#" className="text-[#1250B1] hover:underline">
                                            Forgot password?
                                        </a>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600 italic">Have not activated your account yet?</span>
                                            <a href="#" className="text-[#1250B1] hover:underline">
                                                Signup
                                            </a>
                                        </div>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LoginModal; 
