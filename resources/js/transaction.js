import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");

document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const cartElement = document.getElementById("cart");
  const cartTotalElement = document.getElementById("cartTotal");

  const productsPerPage = 8; // 4 kolom × 2 baris
  let currentPage = 1;
  let allProducts = [];

  function saveTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      console.log("Token berhasil disimpan ke localStorage:", token);
    }
  }

  function validateLogin() {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: "Akses Ditolak",
        text: "Silahkan login terlebih dahulu",
        icon: "warning",
        confirmButtonText: "Login",
      }).then(() => {
        window.location.href = "https://pos-akuntan.github.io/";
      });
    }
  }

  function fetchProducts() {
    fetch("https://pos-ochre.vercel.app/api/products")
      .then((response) => response.json())
      .then((data) => {
        allProducts = data;
        renderProducts();
      })
      .catch((error) => console.error("Error fetching products:", error));
  }

  function renderProducts() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToRender = allProducts.slice(startIndex, endIndex);

    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = "";

    productsToRender.forEach((product) => {
      const productItem = document.createElement("div");
      productItem.classList.add("product-item");
      productItem.innerHTML = `
        <img src="${product.picture_url}" alt="${product.name}">
        <h6>${product.name}</h6>
        <p>${product.category_name}</p>
        <p>Rp ${product.price}</p>
        <p>Stock: <span id="stock-${product.id_products}">${product.stock}</span></p>
      `;
      productItem.addEventListener("click", () => addToCart(product));
      productGrid.appendChild(productItem);
    });

    updatePaginationInfo();
  }

  function updatePaginationInfo() {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);
    document.getElementById(
      "paginationInfo"
    ).innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
  }

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts();
    }
  });

  function addToCart(product) {
    const stockElement = document.getElementById(
      `stock-${product.id_products}`
    );
    let stock = parseInt(stockElement.innerText);

    if (stock > 0) {
      const existingProduct = cart.find(
        (item) => item.id_products === product.id_products
      );
      if (existingProduct) {
        existingProduct.quantity++;
      } else {
        cart.push({
          id_products: product.id_products,
          name: product.name,
          price: product.price,
          quantity: 1,
          category: product.category,
          description: product.description,
        });
      }
      stockElement.innerText = stock - 1;
      localStorage.setItem("selectedProducts", JSON.stringify(cart));
      updateCart();
    } else {
      Swal.fire({
        title: "Stok Habis",
        text: "Tidak dapat menambahkan produk ini",
        icon: "error",
      });
    }
  }

  // Fungsi untuk mengurangi jumlah item atau menghapusnya dari cart
  function decreaseCartItem(index) {
    if (cart[index].quantity > 1) {
      cart[index].quantity--;
    } else {
      cart.splice(index, 1); // Hapus item jika jumlahnya menjadi 0
    }
    localStorage.setItem("selectedProducts", JSON.stringify(cart)); // Update localStorage
    updateCart(); // Perbarui tampilan cart
  }

  function updateCart() {
    cartElement.innerHTML = "";
    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * item.quantity;
      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");
      cartItem.innerHTML = `
        <span>${item.name} (${item.quantity})</span>
        <span>Rp ${item.price * item.quantity}</span>
        <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">-</button>
      `;
      cartElement.appendChild(cartItem);
    });
    cartTotalElement.textContent = `Total: Rp ${total}`;

    // Tambahkan event listener ke tombol "-"
    const removeButtons = document.querySelectorAll(".remove-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const index = parseInt(event.target.dataset.index);
        decreaseCartItem(index);
      });
    });
  }

  const checkoutButton = document.getElementById("checkoutButton");
  checkoutButton.addEventListener("click", () => {
    const paymentModal = new bootstrap.Modal(
      document.getElementById("paymentModal")
    );
    paymentModal.show();
  });

  //button dan fungsi pay
  document.getElementById("payButton").addEventListener("click", async () => {
    const paymentMethod = document.getElementById("paymentMethod").value; // Ambil nilai dari dropdown  
    const selectedProducts =
      JSON.parse(localStorage.getItem("selectedProducts")) || [];
    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const tableNumber = document.getElementById("tableNumber").value;

    // Validasi input
    if (!customerName || !customerPhone || !tableNumber) {
      Swal.fire("Error", "Please fill out all customer details.", "error");
      return;
    }

    if (selectedProducts.length === 0) {
      Swal.fire(
        "Error",
        "No products selected. Please add products to the cart.",
        "error"
      );
      return;
    }

    const totalAmount = selectedProducts.reduce(
      (total, product) => total + parseFloat(product.price) * product.quantity,
      0
    );

    const transactionData = {
      transaction_date: new Date().toISOString(),
      payment_method: paymentMethod,
      total_amount: totalAmount,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_number: tableNumber,
    };

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Error", "Please log in to complete the transaction.", "error");
      return;
    }

    try {
      const response = await fetch(
        "https://pos-ochre.vercel.app/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        Swal.fire(
          "Error",
          errorResponse.message ||
            "There was an error processing the transaction.",
          "error"
        );
        return;
      }

      const transaction = await response.json();

      for (const product of selectedProducts) {
        const transactionItemData = {
          id_transactions: transaction.id_transactions,
          id_products: product.id_products,
          quantity: product.quantity,
          unit_price: product.price,
        };

        const itemResponse = await fetch(
          "https://pos-ochre.vercel.app/api/transaction-items",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(transactionItemData),
          }
        );

        if (!itemResponse.ok) {
          const itemError = await itemResponse.json();
          Swal.fire(
            "Error",
            itemError.message ||
              "There was an error saving the transaction item.",
            "error"
          );
          return;
        }
      }

      // Ambil produk yang baru saja di-checkout
      const itemsResponse = await fetch(
        `https://pos-ochre.vercel.app/api/transaction-items/${transaction.id_transactions}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!itemsResponse.ok) {
        Swal.fire("Error", "Failed to fetch transaction items.", "error");
        return;
      }

      const transactionItems = await itemsResponse.json();

      // Tampilkan popup dengan data produk
      // Tampilkan popup dengan gaya seperti struk pembayaran
      // Tampilkan popup dengan gaya seperti struk pembayaran
      let itemsHtml = `
<table style="width: 100%; text-align: left; border-collapse: collapse;">
<thead>
<tr>
<th style="border-bottom: 1px solid #ddd; padding: 8px;">Product</th>
<th style="border-bottom: 1px solid #ddd; padding: 8px;">Quantity</th>
<th style="border-bottom: 1px solid #ddd; padding: 8px;">Total Price</th>
</tr>
</thead>
<tbody>
`;

      transactionItems.forEach((item) => {
        itemsHtml += `
<tr>
<td style="padding: 8px;">${item.product_name}</td>
<td style="padding: 8px;">${item.quantity}</td>
<td style="padding: 8px;">Rp ${item.total_price.toLocaleString("id-ID")}</td>
</tr>
`;
      });

      itemsHtml += `
</tbody>
</table>
`;

      Swal.fire({
        title: '<h4 style="margin-bottom: 10px;">Transaction Complete!</h4>',
        html: `
<div style="text-align: center;">
<p style="margin: 0; font-size: 14px;">Customer Name:</p>
<strong style="display: block; margin-bottom: 5px; font-size: 16px;">${customerName}</strong>
<p style="margin: 0; font-size: 14px;">Customer Phone:</p>
<strong style="display: block; margin-bottom: 5px; font-size: 16px;">${customerPhone}</strong>
<p style="margin: 0; font-size: 14px;">Table Number:</p>
<strong style="display: block; margin-bottom: 10px; font-size: 16px;">${tableNumber}</strong>
<p style="margin: 0; font-size: 14px;">Products:</p>
${itemsHtml}
<hr style="margin: 10px 0;">
<strong>Total Payment:</strong><br>
<span style="font-size: 18px;">Rp ${totalAmount.toLocaleString("id-ID")}</span>
</div>
`,
        icon: "success",
        showConfirmButton: true,
        confirmButtonText: "OK",
        customClass: {
          popup: "swal2-popup-custom",
        },
        width: "400px",
      }).then(() => {
        // Redirect to transaction.html
        window.location.href = "transaction.html";
      });

      localStorage.removeItem("selectedProducts");
      updateCart();
    } catch (error) {
      console.error("Error Processing Transaction:", error);
      Swal.fire(
        "Error",
        "There was an error processing the transaction.",
        "error"
      );
    }
  });

  // Fitur Sort by Category
  function fetchCategories() {
    fetch("https://pos-ochre.vercel.app/api/categories")
      .then((response) => response.json())
      .then((categories) => {
        const categorySelect = document.getElementById("categorySelect");

        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id_categories;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });

        categorySelect.addEventListener("change", (event) => {
          const selectedCategory = event.target.value;
          if (selectedCategory === "all") {
            fetchProducts();
          } else {
            fetchProductsByCategory(selectedCategory);
          }
        });
      })
      .catch((error) => console.error("Error fetching categories:", error));
  }

  function fetchProductsByCategory(categoryId) {
    fetch(`https://pos-ochre.vercel.app/api/products/category/${categoryId}`)
      .then((response) => response.json())
      .then((products) => {
        allProducts = products;
        renderProducts();
      })
      .catch((error) =>
        console.error("Error fetching products by category:", error)
      );
  }

  saveTokenFromURL();
  validateLogin();
  fetchCategories();
  fetchProducts();
  updateCart();
});
