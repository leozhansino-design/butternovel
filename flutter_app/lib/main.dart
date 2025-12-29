import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'providers/shorts_provider.dart';
import 'providers/user_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'screens/main_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ShortsProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          final isDark = themeProvider.isDarkMode;
          return MaterialApp(
            title: 'ButterNovel',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              brightness: isDark ? Brightness.dark : Brightness.light,
              primaryColor: const Color(0xFF3b82f6),
              scaffoldBackgroundColor: isDark ? Colors.black : Colors.white,
              colorScheme: isDark
                  ? ColorScheme.dark(
                      primary: const Color(0xFF3b82f6),
                      secondary: const Color(0xFF3b82f6),
                      surface: Colors.grey[900]!,
                    )
                  : ColorScheme.light(
                      primary: const Color(0xFF3b82f6),
                      secondary: const Color(0xFF3b82f6),
                      surface: Colors.grey[100]!,
                    ),
              textTheme: GoogleFonts.interTextTheme(
                isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
              ),
              appBarTheme: const AppBarTheme(
                backgroundColor: Colors.transparent,
                elevation: 0,
              ),
              bottomNavigationBarTheme: BottomNavigationBarThemeData(
                backgroundColor: isDark ? Colors.black.withOpacity(0.9) : Colors.white.withOpacity(0.9),
                selectedItemColor: const Color(0xFF3b82f6),
                unselectedItemColor: Colors.grey,
                type: BottomNavigationBarType.fixed,
                showSelectedLabels: true,
                showUnselectedLabels: true,
              ),
            ),
            home: const MainScreen(),
          );
        },
      ),
    );
  }
}
