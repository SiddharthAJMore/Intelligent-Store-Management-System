package com.grocerystore.module.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {

    @NotBlank
    private String name;

    @NotNull
    private Long categoryId;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal price;

    @NotBlank
    private String unit;

    private int lowStockThreshold;

    private String sku;
}
