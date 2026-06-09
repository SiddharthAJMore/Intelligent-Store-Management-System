package com.grocerystore.module.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateInvoiceRequest {

    @NotEmpty
    @Valid
    private List<CreateInvoiceItemRequest> items;
}
