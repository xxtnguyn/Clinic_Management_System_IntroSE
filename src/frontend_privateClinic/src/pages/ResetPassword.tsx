import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Typography } from '@mui/joy';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../api/auth.service';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const resetPasswordSchema = yup.object({
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: yup
        .string()
        .required('Please confirm your password')
        .oneOf([yup.ref('password')], 'Passwords must match'),
}).required();

type ResetPasswordFormInputs = yup.InferType<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const token = searchParams.get('token');

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormInputs>({
        resolver: yupResolver(resetPasswordSchema)
    });

    const onSubmit = async (data: ResetPasswordFormInputs) => {
        if (!token) {
            alert('Invalid reset token');
            return;
        }

        try {
            setIsLoading(true);
            await authService.resetPassword({
                token,
                password: data.password
            });
            alert('Password has been reset successfully');
            navigate('/'); // Redirect to home page after successful reset
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="p-8 bg-white rounded-xl shadow-xl w-full max-w-sm">
                    <Typography level="h3" className="text-2xl font-normal text-center mb-6 text-red-500">
                        Invalid Reset Link
                    </Typography>
                    <p className="text-center text-gray-600 mb-4">
                        This password reset link is invalid or has expired.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 bg-white rounded-xl shadow-xl w-full max-w-sm">
                <Typography level="h3" className="text-2xl font-normal text-center mb-6">
                    Reset Your Password
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                {...register('password')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                onClick={() => setShowPassword((prev) => !prev)}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                {...register('confirmPassword')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                                {showConfirmPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword; 