package com.grocerystore.module.user;

import com.grocerystore.common.exception.ResourceNotFoundException;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.user.dto.UserCreateRequest;
import com.grocerystore.module.user.dto.UserResponse;
import com.grocerystore.module.user.dto.UserUpdateRequest;
import com.grocerystore.module.user.entity.Role;
import com.grocerystore.module.user.entity.User;
import com.grocerystore.module.user.repository.RoleRepository;
import com.grocerystore.module.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public PageResponse<UserResponse> getUsers(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Page<User> result = userRepository.findAll(PageRequest.of(page, size, sort));
        return toPageResponse(result.map(this::toResponse));
    }

    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Role role = roleRepository.findById(request.getRoleId())
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .isActive(true)
            .createdAt(LocalDateTime.now())
            .build();

        return toResponse(userRepository.save(user));
    }

    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userRepository.existsByUsernameAndIdNot(request.getUsername(), id)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new IllegalArgumentException("Email already exists");
        }

        Role role = roleRepository.findById(request.getRoleId())
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    public UserResponse setStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(active);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole().getName())
            .active(user.isActive())
            .createdAt(user.getCreatedAt())
            .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
            .content(page.getContent())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }
}
