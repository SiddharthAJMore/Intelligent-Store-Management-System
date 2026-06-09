package com.grocerystore.module.auth;

import com.grocerystore.module.auth.dto.LoginRequest;
import com.grocerystore.module.auth.dto.LoginResponse;
import com.grocerystore.module.user.entity.User;
import com.grocerystore.module.user.repository.UserRepository;
import com.grocerystore.security.JwtTokenProvider;
import com.grocerystore.security.TokenBlacklistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    public LoginResponse login(LoginRequest request) {
        log.debug("Login attempt for username: {}", request.getUsername());
        User user = userRepository.findByUsernameAndIsActiveTrue(request.getUsername())
            .orElseThrow(() -> {
                log.warn("Login failed: User not found or inactive - {}", request.getUsername());
                return new BadCredentialsException("Invalid username or password");
            });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: Invalid password for user - {}", request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().getName());
        log.info("User logged in successfully: {} [Role: {}]", user.getUsername(), user.getRole().getName());

        return LoginResponse.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .role(user.getRole().getName())
            .token(token)
            .expiresIn(jwtTokenProvider.getExpirationInMs())
            .build();
    }

    public void logout(String token) {
        log.debug("Logout request received");
        if (token == null || token.isBlank() || !jwtTokenProvider.validateToken(token)) {
            log.warn("Logout failed: Invalid or expired token");
            throw new BadCredentialsException("Invalid token");
        }
        tokenBlacklistService.blacklistToken(token, jwtTokenProvider.getExpirationEpochMillis(token));
        log.info("User logged out successfully");
    }
}
