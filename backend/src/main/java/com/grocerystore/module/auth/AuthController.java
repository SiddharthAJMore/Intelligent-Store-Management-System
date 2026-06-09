package com.grocerystore.module.auth;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.module.auth.dto.LoginRequest;
import com.grocerystore.module.auth.dto.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
            .success(true)
            .message("Login successful")
            .data(response)
            .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                .success(false)
                .message("Missing bearer token")
                .build());
        }

        authService.logout(header.substring(7));
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Logout successful")
            .build());
    }
}
