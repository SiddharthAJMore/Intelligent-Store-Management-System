package com.grocerystore.module.user;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.user.dto.UserCreateRequest;
import com.grocerystore.module.user.dto.UserResponse;
import com.grocerystore.module.user.dto.UserStatusUpdateRequest;
import com.grocerystore.module.user.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<UserResponse>>builder()
            .success(true)
            .message("Users fetched")
            .data(userService.getUsers(page, size, sortBy, direction))
            .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
            .success(true)
            .message("User created")
            .data(userService.createUser(request))
            .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
            .success(true)
            .message("User updated")
            .data(userService.updateUser(id, request))
            .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(@PathVariable Long id, @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
            .success(true)
            .message("User status updated")
            .data(userService.setStatus(id, request.isActive()))
            .build());
    }
}
