package com.grocerystore.module.sales;

import com.grocerystore.common.exception.InsufficientStockException;
import com.grocerystore.common.exception.ResourceNotFoundException;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.inventory.entity.Inventory;
import com.grocerystore.module.inventory.entity.MovementType;
import com.grocerystore.module.inventory.entity.StockMovement;
import com.grocerystore.module.inventory.repository.InventoryRepository;
import com.grocerystore.module.inventory.repository.StockMovementRepository;
import com.grocerystore.module.product.entity.Product;
import com.grocerystore.module.product.repository.ProductRepository;
import com.grocerystore.module.sales.dto.CreateInvoiceItemRequest;
import com.grocerystore.module.sales.dto.CreateInvoiceRequest;
import com.grocerystore.module.sales.dto.InvoiceItemResponse;
import com.grocerystore.module.sales.dto.InvoiceResponse;
import com.grocerystore.module.sales.entity.SalesInvoice;
import com.grocerystore.module.sales.entity.SalesInvoiceItem;
import com.grocerystore.module.sales.repository.SalesInvoiceItemRepository;
import com.grocerystore.module.sales.repository.SalesInvoiceRepository;
import com.grocerystore.module.user.entity.User;
import com.grocerystore.module.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class SalesService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final SalesInvoiceItemRepository salesInvoiceItemRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public SalesService(
        SalesInvoiceRepository salesInvoiceRepository,
        SalesInvoiceItemRepository salesInvoiceItemRepository,
        ProductRepository productRepository,
        InventoryRepository inventoryRepository,
        StockMovementRepository stockMovementRepository,
        UserRepository userRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.salesInvoiceRepository = salesInvoiceRepository;
        this.salesInvoiceItemRepository = salesInvoiceItemRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request, String username) {
        log.info("Creating invoice for cashier: {} with {} items", username, request.getItems().size());
        User cashier = userRepository.findByUsernameAndIsActiveTrue(username)
            .orElseThrow(() -> {
                log.error("Cashier not found: {}", username);
                return new ResourceNotFoundException("Cashier not found");
            });

        Map<Long, Integer> quantitiesByProduct = mergeItems(request.getItems());
        Map<Long, Product> products = new HashMap<>();
        Map<Long, Inventory> inventories = new HashMap<>();

        log.debug("Validating {} products for invoice", quantitiesByProduct.size());
        for (Map.Entry<Long, Integer> entry : quantitiesByProduct.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                .orElseThrow(() -> {
                    log.error("Product not found: {}", entry.getKey());
                    return new ResourceNotFoundException("Product not found: " + entry.getKey());
                });
            if (!product.isActive()) {
                log.warn("Attempt to sell inactive product: {}", product.getName());
                throw new IllegalArgumentException("Inactive product cannot be sold: " + product.getName());
            }

            Inventory inventory = inventoryRepository.findByProductId(product.getId())
                .orElseThrow(() -> {
                    log.error("Inventory not found for product: {}", product.getName());
                    return new ResourceNotFoundException("Inventory not found for product: " + product.getName());
                });

            if (inventory.getQuantity() < entry.getValue()) {
                log.warn("Insufficient stock for product: {} - Required: {}, Available: {}", 
                    product.getName(), entry.getValue(), inventory.getQuantity());
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            log.debug("Product validation passed: {} - Qty: {}, Available: {}", 
                product.getName(), entry.getValue(), inventory.getQuantity());
            products.put(product.getId(), product);
            inventories.put(product.getId(), inventory);
        }

        Long seq = jdbcTemplate.queryForObject("SELECT nextval('invoice_number_seq')", Long.class);
        String invoiceNumber = "INV-" + seq;
        log.debug("Generated invoice number: {}", invoiceNumber);

        SalesInvoice invoice = SalesInvoice.builder()
            .invoiceNumber(invoiceNumber)
            .cashier(cashier)
            .totalAmount(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .build();
        invoice = salesInvoiceRepository.save(invoice);
        log.debug("Invoice saved with ID: {}", invoice.getId());

        BigDecimal total = BigDecimal.ZERO;
        List<SalesInvoiceItem> createdItems = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : quantitiesByProduct.entrySet()) {
            Product product = products.get(entry.getKey());
            Integer qty = entry.getValue();
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(qty));

            SalesInvoiceItem item = SalesInvoiceItem.builder()
                .invoice(invoice)
                .product(product)
                .quantity(qty)
                .unitPrice(product.getPrice())
                .subtotal(subtotal)
                .build();
            createdItems.add(item);
            total = total.add(subtotal);
            log.debug("Added item: {} - Qty: {}, Unit Price: ₹{}, Subtotal: ₹{}", 
                product.getName(), qty, product.getPrice(), subtotal);

            Inventory inventory = inventories.get(product.getId());
            inventory.setQuantity(inventory.getQuantity() - qty);
            inventory.setLastUpdated(LocalDateTime.now());
            inventoryRepository.save(inventory);
            log.debug("Updated inventory for product: {} - New quantity: {}", 
                product.getName(), inventory.getQuantity());

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType(MovementType.SALE_OUT)
                .quantityChange(-qty)
                .referenceId(invoice.getId())
                .notes(null)
                .createdAt(LocalDateTime.now())
                .build());
        }

        salesInvoiceItemRepository.saveAll(createdItems);
        invoice.setTotalAmount(total);
        salesInvoiceRepository.save(invoice);
        log.info("Invoice created successfully: {} - Total: ₹{}, Items: {}, Cashier: {}", 
            invoiceNumber, total, createdItems.size(), username);

        return buildInvoiceResponse(invoice, createdItems);
    }

    public PageResponse<InvoiceResponse> getInvoices(LocalDate from, LocalDate to, int page, int size, String sortBy, String direction) {
        log.debug("Fetching invoices - From: {}, To: {}, Page: {}, Size: {}, Sort: {} {}", from, to, page, size, sortBy, direction);
        LocalDateTime fromDate = from == null ? LocalDateTime.of(1900, 1, 1, 0, 0, 0) : from.atStartOfDay();
        LocalDateTime toDate = to == null ? LocalDateTime.of(2099, 12, 31, 23, 59, 59) : to.atTime(23, 59, 59);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Page<SalesInvoice> invoices = salesInvoiceRepository.findByCreatedAtRange(fromDate, toDate, PageRequest.of(page, size, sort));
        log.debug("Found {} invoices for the specified date range", invoices.getTotalElements());
        return toPageResponse(invoices.map(invoice -> buildInvoiceResponse(invoice, salesInvoiceItemRepository.findByInvoiceId(invoice.getId()))));
    }

    public InvoiceResponse getInvoice(Long id) {
        log.debug("Fetching invoice details - ID: {}", id);
        SalesInvoice invoice = salesInvoiceRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Invoice not found - ID: {}", id);
                return new ResourceNotFoundException("Invoice not found");
            });
        List<SalesInvoiceItem> items = salesInvoiceItemRepository.findByInvoiceId(id);
        return buildInvoiceResponse(invoice, items);
    }

    private Map<Long, Integer> mergeItems(List<CreateInvoiceItemRequest> items) {
        Map<Long, Integer> merged = new HashMap<>();
        for (CreateInvoiceItemRequest item : items) {
            merged.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }
        return merged;
    }

    private InvoiceResponse buildInvoiceResponse(SalesInvoice invoice, List<SalesInvoiceItem> items) {
        List<InvoiceItemResponse> mapped = items.stream()
            .map(item -> InvoiceItemResponse.builder()
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build())
            .toList();

        return InvoiceResponse.builder()
            .id(invoice.getId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .cashierId(invoice.getCashier().getId())
            .cashierUsername(invoice.getCashier().getUsername())
            .totalAmount(invoice.getTotalAmount())
            .createdAt(invoice.getCreatedAt())
            .items(mapped)
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
