import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { loginUser, resendVerification } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

type LoginData = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | "verification" | null;
    message: string;
    email?: string;
  }>({ type: null, message: "" });

  const initialValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (values: LoginData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await loginUser(values);

      setSubmitStatus({
        type: "success",
        message: `Welcome back, ${response.data?.user?.name}! Login successful.`,
      });

      // Redirect based on role after successful login
      setTimeout(() => {
        switch (response.data?.user?.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'doctor':
          case 'patient':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }, 1500);
    } catch (error: any) {
      if (error.message?.includes("verify your email")) {
        setSubmitStatus({
          type: "verification",
          message: error.message,
          email: values.email,
        });
      } else {
        setSubmitStatus({
          type: "error",
          message:
            error.message || "Login failed. Please check your credentials.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!submitStatus.email) return;

    setIsResendingVerification(true);
    try {
      await resendVerification(submitStatus.email);
      setSubmitStatus({
        type: "success",
        message: "Verification email sent! Please check your inbox.",
      });
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Failed to resend verification email.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-6">Sign in to your MediTrack account</p>
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-8 shadow-xl rounded-xl border border-gray-100">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty }) => (
              <Form className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
                  >
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    Email Address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email address"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
                  >
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Status Message */}
                {submitStatus.type && (
                  <div
                    className={`p-4 rounded-lg ${
                      submitStatus.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : submitStatus.type === "verification"
                        ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 mt-2 flex-shrink-0 ${
                          submitStatus.type === "success"
                            ? "bg-green-500"
                            : submitStatus.type === "verification"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {submitStatus.message}
                        </p>
                        {submitStatus.type === "verification" && (
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={isResendingVerification}
                            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
                          >
                            {isResendingVerification
                              ? "Sending..."
                              : "Resend verification email"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isValid || !dirty || isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                    !isValid || !dirty || isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </Form>
            )}
          </Formik>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your login is secured with industry-standard encryption. Having
            trouble? Contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
