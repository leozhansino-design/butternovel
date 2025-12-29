import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:crypto/crypto.dart';

import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _usernameController = TextEditingController();

  bool _isLogin = true;
  bool _obscurePassword = true;
  String? _errorMessage;
  bool _isGoogleLoading = false;
  bool _isAppleLoading = false;

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _errorMessage = null);

    final authProvider = context.read<AuthProvider>();
    Map<String, dynamic> result;

    if (_isLogin) {
      result = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      result = await authProvider.register(
        _emailController.text.trim(),
        _passwordController.text,
        _usernameController.text.trim(),
      );
    }

    if (mounted) {
      if (result['success'] == true) {
        Navigator.pop(context, true);
      } else {
        setState(() => _errorMessage = result['error'] as String?);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isGoogleLoading = true;
      _errorMessage = null;
    });

    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        // User cancelled
        setState(() => _isGoogleLoading = false);
        return;
      }

      final authProvider = context.read<AuthProvider>();
      final result = await authProvider.loginWithGoogle(
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoUrl: googleUser.photoUrl,
        googleId: googleUser.id,
      );

      if (mounted) {
        setState(() => _isGoogleLoading = false);
        if (result['success'] == true) {
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = result['error'] as String?);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage = 'Google sign in failed. Please try again.';
        });
      }
    }
  }

  String _generateNonce([int length = 32]) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
  }

  String _sha256ofString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<void> _handleAppleSignIn() async {
    setState(() {
      _isAppleLoading = true;
      _errorMessage = null;
    });

    try {
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);

      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
      );

      final authProvider = context.read<AuthProvider>();
      final result = await authProvider.loginWithApple(
        email: credential.email,
        fullName: '${credential.givenName ?? ''} ${credential.familyName ?? ''}'.trim(),
        appleId: credential.userIdentifier,
      );

      if (mounted) {
        setState(() => _isAppleLoading = false);
        if (result['success'] == true) {
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = result['error'] as String?);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isAppleLoading = false;
          if (e.toString().contains('canceled')) {
            _errorMessage = null; // User cancelled, no error
          } else {
            _errorMessage = 'Apple sign in failed. Please try again.';
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, AuthProvider>(
      builder: (context, themeProvider, authProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;
        final borderColor = isDark ? Colors.grey[700]! : Colors.grey[300]!;

        return Scaffold(
          backgroundColor: bgColor,
          appBar: AppBar(
            backgroundColor: bgColor,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.close, color: textColor),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Center(
                      child: Column(
                        children: [
                          Text(
                            _isLogin ? 'Welcome back!' : 'Create your account',
                            style: TextStyle(
                              color: textColor,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _isLogin
                                ? 'Sign in to continue reading'
                                : 'Join ButterNovel today',
                            style: TextStyle(
                              color: subtitleColor,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Social login buttons
                    _buildSocialButton(
                      onPressed: _isGoogleLoading ? null : _handleGoogleSignIn,
                      icon: _buildGoogleIcon(),
                      label: 'Continue with Google',
                      isLoading: _isGoogleLoading,
                      isDark: isDark,
                      cardBgColor: cardBgColor,
                      textColor: textColor,
                      borderColor: borderColor,
                    ),
                    const SizedBox(height: 12),
                    _buildSocialButton(
                      onPressed: _isAppleLoading ? null : _handleAppleSignIn,
                      icon: Icon(Icons.apple, color: textColor, size: 24),
                      label: 'Continue with Apple',
                      isLoading: _isAppleLoading,
                      isDark: isDark,
                      cardBgColor: cardBgColor,
                      textColor: textColor,
                      borderColor: borderColor,
                    ),
                    const SizedBox(height: 24),

                    // Divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: borderColor)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'or',
                            style: TextStyle(color: subtitleColor, fontSize: 14),
                          ),
                        ),
                        Expanded(child: Divider(color: borderColor)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Error message
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Colors.red, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Username field (only for register)
                    if (!_isLogin) ...[
                      Text(
                        'Username',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _usernameController,
                        style: TextStyle(color: textColor),
                        decoration: _buildInputDecoration(
                          hintText: 'Enter your username',
                          prefixIcon: Icons.person_outline,
                          subtitleColor: subtitleColor,
                          cardBgColor: cardBgColor,
                          borderColor: borderColor,
                        ),
                        validator: (value) {
                          if (!_isLogin && (value == null || value.isEmpty)) {
                            return 'Please enter a username';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Email field
                    Text(
                      'Email',
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: TextStyle(color: textColor),
                      decoration: _buildInputDecoration(
                        hintText: 'Enter your email',
                        prefixIcon: Icons.email_outlined,
                        subtitleColor: subtitleColor,
                        cardBgColor: cardBgColor,
                        borderColor: borderColor,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        if (!value.contains('@')) {
                          return 'Please enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Password field
                    Text(
                      'Password',
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      style: TextStyle(color: textColor),
                      decoration: _buildInputDecoration(
                        hintText: 'Enter your password',
                        prefixIcon: Icons.lock_outline,
                        subtitleColor: subtitleColor,
                        cardBgColor: cardBgColor,
                        borderColor: borderColor,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off : Icons.visibility,
                            color: subtitleColor,
                          ),
                          onPressed: () {
                            setState(() => _obscurePassword = !_obscurePassword);
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your password';
                        }
                        if (value.length < 6) {
                          return 'Password must be at least 6 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: authProvider.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3b82f6),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          disabledBackgroundColor: const Color(0xFF3b82f6).withOpacity(0.5),
                        ),
                        child: authProvider.isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _isLogin ? 'Sign In' : 'Create Account',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Toggle login/register
                    Center(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isLogin = !_isLogin;
                            _errorMessage = null;
                          });
                        },
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(color: subtitleColor, fontSize: 14),
                            children: [
                              TextSpan(
                                text: _isLogin
                                    ? "Don't have an account? "
                                    : 'Already have an account? ',
                              ),
                              TextSpan(
                                text: _isLogin ? 'Sign Up' : 'Sign In',
                                style: const TextStyle(
                                  color: Color(0xFF3b82f6),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  InputDecoration _buildInputDecoration({
    required String hintText,
    required IconData prefixIcon,
    required Color subtitleColor,
    required Color cardBgColor,
    required Color borderColor,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: TextStyle(color: subtitleColor),
      filled: true,
      fillColor: cardBgColor,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF3b82f6)),
      ),
      prefixIcon: Icon(prefixIcon, color: subtitleColor),
      suffixIcon: suffixIcon,
    );
  }

  Widget _buildGoogleIcon() {
    return SizedBox(
      width: 24,
      height: 24,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            child: Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'G',
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton({
    required VoidCallback? onPressed,
    required Widget icon,
    required String label,
    required bool isLoading,
    required bool isDark,
    required Color cardBgColor,
    required Color textColor,
    required Color borderColor,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: cardBgColor,
          side: BorderSide(color: borderColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: textColor,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  icon,
                  const SizedBox(width: 12),
                  Text(
                    label,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
