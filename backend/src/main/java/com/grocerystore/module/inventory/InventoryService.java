package com.grocerystore.module.inventory;

import com.grocerystore.common.exception.ResourceNotFoundException;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.inventory.dto.InventoryResponse;
import com.grocerystore.module.inventory.dto.StockInRequest;
import com.grocerystore.module.inventory.dto.StockMovementResponse;
import com.grocerystore.module.inventory.entity.Inventory;
import com.grocerystore.module.inventory.entity.MovementType;
import com.grocerystore.module.inventory.entity.StockMovement;
import com.grocerystore.module.inventory.repository.InventoryRepository;
import com.grocerystore.module.inventory.repository.StockMovementRepository;
import com.grocerystore.module.product.entity.Product;
import com.grocerystore.module.product.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;

    public InventoryService(
        InventoryRepository inventoryRepository,
        StockMovementRepository stockMovementRepository,
        ProductRepository productRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
    }

    public PageResponse<InventoryResponse> getInventory(int page, int size, String sortBy, String direction) {
        log.debug("Sort by: {}", sortBy);
        Page<Inventory> result;
        
        // Special handling for status sorting - sort by (quantity - lowStockThreshold)
        if ("status".equalsIgnoreCase(sortBy)) {
            if ("desc".equalsIgnoreCase(direction)) {
                result = inventoryRepository.findAllOrderByStatusDesc(PageRequest.of(page, size));
            } else {
                result = inventoryRepository.findAllOrderByStatusAsc(PageRequest.of(page, size));
            }
        } else {
            // Standard sorting for other fields
            result = inventoryRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy))
            );
        }
        
        return toPageResponse(result.map(this::toResponse));
    }

    public InventoryResponse getByProductId(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
        return toResponse(inventory);
    }

    @Transactional
    public InventoryResponse stockIn(StockInRequest request) {
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
            .orElseGet(() -> Inventory.builder()
                .product(product)
                .quantity(0)
                .lowStockThreshold(10)
                .lastUpdated(LocalDateTime.now())
                .build());

        inventory.setQuantity(inventory.getQuantity() + request.getQuantity());
        inventory.setLastUpdated(LocalDateTime.now());
        Inventory saved = inventoryRepository.save(inventory);

        StockMovement movement = StockMovement.builder()
            .product(product)
            .movementType(MovementType.STOCK_IN)
            .quantityChange(request.getQuantity())
            .referenceId(null)
            .notes(request.getNotes())
            .createdAt(LocalDateTime.now())
            .build();
        stockMovementRepository.save(movement);

        return toResponse(saved);
    }

    public PageResponse<InventoryResponse> getLowStock(int page, int size, String sortBy, String direction) {
        Page<Inventory> result = inventoryRepository.findLowStock(PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy)));
        return toPageResponse(result.map(this::toResponse));
    }

    public PageResponse<StockMovementResponse> getMovements(Long productId, int page, int size, String sortBy, String direction) {
        Page<StockMovement> result = stockMovementRepository.findByProductId(
            productId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy))
        );
        return toPageResponse(result.map(this::toMovementResponse));
    }

    private InventoryResponse toResponse(Inventory inventory) {
        return InventoryResponse.builder()
            .productId(inventory.getProduct().getId())
            .productName(inventory.getProduct().getName())
            .categoryId(inventory.getProduct().getCategory().getId())
            .quantity(inventory.getQuantity())
            .lowStockThreshold(inventory.getLowStockThreshold())
            .lowStock(inventory.getQuantity() <= inventory.getLowStockThreshold())
            .lastUpdated(inventory.getLastUpdated())
            .build();
    }

    private StockMovementResponse toMovementResponse(StockMovement movement) {
        return StockMovementResponse.builder()
            .id(movement.getId())
            .productId(movement.getProduct().getId())
            .movementType(movement.getMovementType())
            .quantityChange(movement.getQuantityChange())
            .referenceId(movement.getReferenceId())
            .notes(movement.getNotes())
            .createdAt(movement.getCreatedAt())
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
