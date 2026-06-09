package com.grocerystore.module.sales;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.sales.dto.CreateInvoiceRequest;
import com.grocerystore.module.sales.dto.InvoiceResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/sales/invoices")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(
        @Valid @RequestBody CreateInvoiceRequest request,
        Authentication authentication
    ) {
        InvoiceResponse response = salesService.createInvoice(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
            .success(true)
            .message("Invoice created")
            .data(response)
            .build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> list(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<InvoiceResponse>>builder()
            .success(true)
            .message("Invoices fetched")
            .data(salesService.getInvoices(from, to, page, size, sortBy, direction))
            .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
            .success(true)
            .message("Invoice fetched")
            .data(salesService.getInvoice(id))
            .build());
    }
}
