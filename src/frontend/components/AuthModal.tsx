/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Authentication Modal & Cryptographic Token Inspector
 * Provides tabbed Sign In, Sign Up, Quick Enterprise Persona Switcher, TOTP 2FA Verification,
 * and Live RFC 7519 JWT Token Decoded Claims Inspector.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Key,
  CheckCircle,
  AlertTriangle,
  X,
  Copy,
  RefreshCw,
  Clock,
  Eye,
  EyeOff,
  Building,
  UserCheck,
} from 'lucide-react';
import { UserRole, SignUpRequest, SignInRequest, JwtClaims, Organization } from '../../packages/shared-types/index.ts';
import { CryptoEngine, JwtAuthService } from '../../backend/services/jwtAuthService.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  rawAccessToken: string;
  decodedClaims: JwtClaims | null;
  secondsRemaining: number;
  organizations: Organization[];
  onRefreshToken: () => void;
  onSignIn: (req: SignInRequest) => Promise<any>;
  onSignUp: (req: SignUpRequest) => Promise<any>;
  onSignOut: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  rawAccessToken,
  decodedClaims,
  secondsRemaining,
  organizations,
  onRefreshToken,
  onSignIn,
  onSignUp,
  onSignOut,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'SIGN_IN' | 'SIGN_UP' | 'JWT_INSPECTOR'>('SIGN_IN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('frank.mueller@apexlogistics.io');
  const [signInPassword, setSignInPassword] = useState('DispatcherPass2025!');
  const [signInMfa, setSignInMfa] = useState('123456');

  // Sign Up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('DISPATCHER');
  const [signUpTenantId, setSignUpTenantId] = useState(organizations[0].id);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    return Math.min(100, score);
  };

  const pwdScore = getPasswordStrength(signUpPassword);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await onSignIn({
        email: signInEmail,
        password: signInPassword,
        mfaToken: signInMfa,
      });

      if (res?.success) {
        setSuccessMessage('Successfully signed in! JWT tokens issued.');
        setTimeout(() => onClose(), 1000);
      } else {
        setErrorMessage(res?.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await onSignUp({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        role: signUpRole,
        tenantId: signUpTenantId,
      });

      if (res?.success) {
        setSuccessMessage('Account registered and signed in! Welcome to LogiFlow Enterprise.');
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMessage(res?.message || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPersona = (role: UserRole, email: string, pass: string) => {
    setSignInEmail(email);
    setSignInPassword(pass);
    setSignInMfa('123456');
    onSelectRole(role);
  };

  const handleCopyJwt = () => {
    if (rawAccessToken) {
      navigator.clipboard.writeText(rawAccessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate real-time TOTP code for testing
  const activeTotpSecret = JwtAuthService.getTotpSecretForUser(signInEmail);
  const currentGeneratedTotp = activeTotpSecret ? CryptoEngine.generateTotp(activeTotpSecret) : '123456';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                LogiFlow Identity & Access Management
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  JWT HS256 Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Zero-Trust Multi-Tenant RBAC Security & Session Inspector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold px-4 pt-2">
          <button
            onClick={() => setActiveTab('SIGN_IN')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'SIGN_IN'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => setActiveTab('SIGN_UP')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'SIGN_UP'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Register Account
          </button>
          <button
            onClick={() => setActiveTab('JWT_INSPECTOR')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'JWT_INSPECTOR'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> JWT Claims Inspector
            {secondsRemaining > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
              </span>
            )}
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'SIGN_IN' && (
            <div className="space-y-4">
              {/* Quick Persona Switcher */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Enterprise Personas (One-Click Credentials)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('DISPATCHER', 'frank.mueller@apexlogistics.io', 'DispatcherPass2025!')}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">Frank Mueller</div>
                    <div className="text-[10px] text-blue-400">DISPATCHER</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('ADMIN', 'elena.rostova@apexlogistics.io', 'ApexAdmin2025!')}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">Elena Rostova</div>
                    <div className="text-[10px] text-purple-400">ADMIN</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('FLEET_DRIVER', 'lars.vanderbeek@apexlogistics.io', 'FleetDriver2025!')}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">Lars van der Beek</div>
                    <div className="text-[10px] text-emerald-400">FLEET DRIVER</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('COMPLIANCE_AUDITOR', 'sarah.chen@apexlogistics.io', 'AuditorCompliance2025!')}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">Sarah Chen, Esq.</div>
                    <div className="text-[10px] text-amber-400">COMPLIANCE AUDITOR</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('WAREHOUSE_MANAGER', 'astrid.l@apexlogistics.io', 'WarehouseManager2025!')}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">Astrid Lindberg</div>
                    <div className="text-[10px] text-cyan-400">WAREHOUSE MGR</div>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Corporate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      placeholder="user@apexlogistics.io"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">2FA / TOTP Authenticator Code</label>
                    <button
                      type="button"
                      onClick={() => setSignInMfa(currentGeneratedTotp)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Use live token: {currentGeneratedTotp}
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={signInMfa}
                      onChange={(e) => setSignInMfa(e.target.value)}
                      placeholder="6-digit code (e.g. 123456)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
                  >
                    Clear Active Session
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying Credentials...' : 'Authenticate & Issue JWT'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER ACCOUNT */}
          {activeTab === 'SIGN_UP' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    placeholder="marcus.vance@apexlogistics.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters, uppercase, numbers"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {signUpPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pwdScore > 70
                            ? 'bg-emerald-500'
                            : pwdScore > 40
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${pwdScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Entropy Score: {pwdScore}/100</span>
                      <span>{pwdScore > 70 ? 'Strong' : pwdScore > 40 ? 'Moderate' : 'Weak'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Assigned Role</label>
                  <select
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DISPATCHER">DISPATCHER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="FLEET_DRIVER">FLEET_DRIVER</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER</option>
                    <option value="COMPLIANCE_AUDITOR">COMPLIANCE_AUDITOR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tenant Organization</label>
                  <select
                    value={signUpTenantId}
                    onChange={(e) => setSignUpTenantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Secure Account...' : 'Complete Registration & Sign In'}
              </button>
            </form>
          )}

          {/* TAB 3: JWT CLAIMS INSPECTOR */}
          {activeTab === 'JWT_INSPECTOR' && (
            <div className="space-y-4">
              {/* Token Stats Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Token Expiration Countdown:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRefreshToken}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  Refresh Token
                </button>
              </div>

              {/* Raw Bearer Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Raw Authorization Bearer Token
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyJwt}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Token'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 break-all select-all max-h-20 overflow-y-auto">
                  {rawAccessToken || 'No active token'}
                </div>
              </div>

              {/* Decoded Claims */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Decoded Claims Payload (RFC 7519)
                </label>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <pre>{JSON.stringify(decodedClaims, null, 2)}</pre>
                </div>
              </div>

              {/* Granular RBAC Permissions List */}
              {decodedClaims?.permissions && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Active RBAC Security Privileges ({decodedClaims.permissions.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {decodedClaims.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/60"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
