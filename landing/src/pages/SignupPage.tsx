import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../shared/components/ui/Card';
import {
    CheckCircle,
    ArrowRight,
    UserPlus,
    Shield,
    User,
    Trophy,
    XCircle,
    Sparkles
} from 'lucide-react';
import { Input } from '../shared/components/ui/Input';
import { Label } from '../shared/components/ui/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../shared/components/ui/Select';
import { Button } from '../components/Button';
import { AuthentikSignupService } from '../services/auth/AuthentikSignupService';
import type { BusinessSignupData } from '../services/auth/AuthentikSignupService';
import { Spinner } from '../shared/components/ui/Spinner';

type SignupStep = 'welcome' | 'business' | 'user' | 'registering' | 'complete';

export default function SignupPage() {
    const [currentStep, setCurrentStep] = useState<SignupStep>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<BusinessSignupData>({
        businessName: '',
        businessType: 'startup',
        industry: 'technology',
        companySize: '1-10',
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        website: '',
        phone: '',
    });

    const steps = [
        {
            id: 'welcome' as SignupStep,
            title: 'Welcome',
            description: 'Start your business journey with Nexus',
            icon: UserPlus,
            status: currentStep === 'welcome' ? 'current' : (['business', 'user', 'registering', 'complete'].includes(currentStep) ? 'completed' : 'upcoming')
        },
        {
            id: 'business' as SignupStep,
            title: 'Business Info',
            description: 'Tell us about your organization',
            icon: Shield,
            status: currentStep === 'business' ? 'current' : (['user', 'registering', 'complete'] as string[]).includes(currentStep) ? 'completed' : 'upcoming'
        },
        {
            id: 'user' as SignupStep,
            title: 'Personal Info',
            description: 'Create your personal account',
            icon: User,
            status: currentStep === 'user' ? 'current' : (['registering', 'complete'] as string[]).includes(currentStep) ? 'completed' : 'upcoming'
        },
        {
            id: 'complete' as SignupStep,
            title: 'Ready',
            description: 'Your account is being prepared',
            icon: Trophy,
            status: (currentStep === 'complete' || currentStep === 'registering') ? 'current' : 'upcoming'
        }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (currentStep === 'welcome') setCurrentStep('business');
        else if (currentStep === 'business') {
            if (!formData.businessName) {
                setError('Business name is required');
                return;
            }
            setError('');
            setCurrentStep('user');
        }
        else if (currentStep === 'user') {
            if (!formData.email || !formData.firstName || !formData.lastName || !formData.username) {
                setError('Please fill in all required user fields');
                return;
            }
            setError('');
            handleCompleteSignup();
        }
    };

    const handleBack = () => {
        if (currentStep === 'business') setCurrentStep('welcome');
        else if (currentStep === 'user') setCurrentStep('business');
    };

    const handleCompleteSignup = async () => {
        setLoading(true);
        setError('');
        setCurrentStep('registering');

        try {
            const result = await AuthentikSignupService.createUser(formData);

            if (result.success) {
                setCurrentStep('complete');
            } else {
                setError(result.error || 'Failed to create account');
                setCurrentStep('user');
            }
        } catch (err) {
            setError('An unexpected error occurred during registration');
            setCurrentStep('user');
        } finally {
            setLoading(false);
        }
    };

    const getStepIcon = (step: typeof steps[0]) => {
        const Icon = step.icon;
        const status = step.status;

        if (status === 'completed') {
            return <CheckCircle className="w-6 h-6 text-green-500" />;
        } else if (status === 'current') {
            return <Icon className="w-6 h-6 text-primary" />;
        } else {
            return <Icon className="w-6 h-6 text-muted-foreground" />;
        }
    };

    const getStepStatus = (step: typeof steps[0]) => {
        switch (step.status) {
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'current':
                return 'text-primary bg-primary/10 border-primary/20';
            default:
                return 'text-muted-foreground bg-muted/50 border-muted';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Mini Header */}
            <header className="py-4 px-6 border-b flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="font-bold text-xl tracking-tight">Nexus</span>
                </Link>
                <div className="text-sm text-muted-foreground">
                    Step {steps.findIndex(s => s.id === currentStep) + 1} of 4
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl border-border/60 shadow-lg bg-card">
                    <div className="p-6 space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Create your Nexus account</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Join the ecosystem for modern business operations
                            </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between px-4">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center space-y-2 relative z-10">
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${getStepStatus(step)}`}>
                                            {getStepIcon(step)}
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${step.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-[2px] mb-6 mx-2 ${steps[index].status === 'completed' ? 'bg-green-200' : 'bg-muted'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="min-h-[300px] flex flex-col justify-center">
                            {/* Step 1: Welcome */}
                            {currentStep === 'welcome' && (
                                <div className="space-y-6">
                                    <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            Nexus Core Platform
                                        </h3>
                                        <ul className="text-sm text-muted-foreground space-y-2.5">
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <span>Unified workspace for AI and business context</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <span>Enterprise-grade security via Marcoby Identity</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <span>Managed integrations with active business data</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={handleNext}
                                        className="w-full h-12 text-base font-medium"
                                    >
                                        Get Started
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Business Info */}
                            {currentStep === 'business' && (
                                <div className="space-y-5">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">Business Name</Label>
                                            <Input
                                                id="businessName"
                                                name="businessName"
                                                placeholder="Acme Corp"
                                                value={formData.businessName}
                                                onChange={handleInputChange}
                                                className="h-11 border-input bg-background"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="businessType">Business Type</Label>
                                                <Select
                                                    value={formData.businessType}
                                                    onValueChange={(v) => handleSelectChange('businessType', v)}
                                                >
                                                    <SelectTrigger className="h-11 border-input bg-background">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-input">
                                                        <SelectItem value="startup">Startup</SelectItem>
                                                        <SelectItem value="small-business">Small Business</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                                        <SelectItem value="non-profit">Non-Profit</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="companySize">Team Size</Label>
                                                <Select
                                                    value={formData.companySize}
                                                    onValueChange={(v) => handleSelectChange('companySize', v)}
                                                >
                                                    <SelectTrigger className="h-11 border-input bg-background">
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-input">
                                                        <SelectItem value="1-10">1-10</SelectItem>
                                                        <SelectItem value="11-50">11-50</SelectItem>
                                                        <SelectItem value="51-200">51-200</SelectItem>
                                                        <SelectItem value="201+">201+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="industry">Industry</Label>
                                            <Input
                                                id="industry"
                                                name="industry"
                                                placeholder="Technology, Finance, etc."
                                                value={formData.industry}
                                                onChange={handleInputChange}
                                                className="h-11 border-input bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" onClick={handleBack} className="flex-1 h-11 border-input bg-background hover:bg-muted text-foreground">
                                            Back
                                        </Button>
                                        <Button onClick={handleNext} className="flex-1 h-11">
                                            Next: Personal Info
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: User Info */}
                            {currentStep === 'user' && (
                                <div className="space-y-5">
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    name="firstName"
                                                    placeholder="John"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="h-11 border-input bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    name="lastName"
                                                    placeholder="Doe"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="h-11 border-input bg-background"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Work Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="john@acme.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="h-11 border-input bg-background"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                placeholder="johndoe"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="h-11 border-input bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" onClick={handleBack} className="flex-1 h-11 border-input bg-background hover:bg-muted text-foreground">
                                            Back
                                        </Button>
                                        <Button onClick={handleNext} disabled={loading} className="flex-1 h-11">
                                            {loading ? <Spinner className="w-4 h-4" /> : 'Create Account'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Registering */}
                            {currentStep === 'registering' && (
                                <div className="text-center space-y-6 py-8">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                        <Shield className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold text-foreground">Creating your identity</h3>
                                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                            We're setting up your secure account with Marcoby Identity Services...
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <Spinner className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Complete */}
                            {currentStep === 'complete' && (
                                <div className="text-center space-y-6 py-8">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-foreground">Welcome to Nexus!</h3>
                                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                            Your account has been created successfully. We've sent an email to <strong>{formData.email}</strong> to set your password and verify your account.
                                        </p>
                                    </div>
                                    <div className="pt-4">
                                        <Button asChild className="w-full h-11">
                                            <a href="https://napp.marcoby.net/login">Go to Login</a>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-4 border-t border-border/40">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <a href="https://napp.marcoby.net/login" className="text-primary hover:underline font-medium">
                                    Sign in
                                </a>
                            </p>
                            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mt-4 inline-block transition-colors">
                                ← Return to Nexus Home
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
