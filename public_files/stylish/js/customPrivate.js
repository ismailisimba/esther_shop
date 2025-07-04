async function main() {
    const status = await fetch("/checkloginstatus").then(res => res.json())
    if (!status.status) return
    fillInProfileData(status)
    checkAddPermission(status)
    showEditPageModal(status.plainCookie)
}

main()

function fillInProfileData(status) {
    const profileData = status.plainCookie;
    const modalBody = document.querySelector('#modallogin .modal-body');

    const profileHtml = `
        <div>
            <h3>Profile Information</h3>
            <p><strong>Username:</strong> ${profileData.username}</p>
            <p><strong>Email:</strong> ${profileData.user}</p>
            <p><strong>User Type:</strong> ${profileData.userType}</p>
            <p><strong>Super Admin Type:</strong> ${profileData.superAdminType}</p>
            <h4>Permissions</h4>
            <p><strong>Can Add:</strong> ${profileData.userPermittedActions.canAdd}</p>
            <p><strong>Can Delete:</strong> ${profileData.userPermittedActions.canDelete}</p>
            <p><strong>Can Edit:</strong> ${profileData.userPermittedActions.canEdit}</p>
            <p><strong>Can View:</strong> ${profileData.userPermittedActions.canView}</p>
            <h4>Login Details</h4>
            <p><strong>IP Address:</strong> ${profileData.ipadd}</p>
            <p><strong>Action:</strong> ${profileData.action}</p>
            <p><strong>Date:</strong> ${profileData.date.year}-${profileData.date.month}-${profileData.date.day} ${profileData.date.hour}:${profileData.date.minute}:${profileData.date.second} ${profileData.date.tzone}</p>
            <button id="logout-button" class="btn btn-red hvr-sweep-to-right dark-sweep">Logout</button>
            <button id="admin-upgrade-button" class="btn btn-red hvr-sweep-to-right dark-sweep">Upgrade to admin</button>
        </div>
    `;

    modalBody.innerHTML = profileHtml;

    document.querySelectorAll("#modallogin .modal-title")[0].innerHTML = "Profile Information";
    document.getElementById("login-href").innerText = "Logout"

    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout', { method: 'GET' });
            if (response.ok) {
                alert('Logged out successfully!');
                // Optionally, you can redirect the user or refresh the page
                window.location.reload();
            } else {
                alert('Failed to log out.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while logging out.');
        }
    });

    document.getElementById('admin-upgrade-button').addEventListener('click', showAdminUpgradePopup);
}

function checkAddPermission(status) {
    const profileData = status.plainCookie;
    
    if (profileData.userPermittedActions.canAdd) {

        document.getElementById("arrow-up-from-bracket-href").style.display = "block"

        // Create the modal for adding items
        const addItemModal = `
            <div class="modal fade" id="modalAddItem" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-fullscreen-md-down modal-md modal-dialog-centered" role="document">
                    <div class="modal-content p-4">
                        <div class="modal-header mx-auto border-0">
                            <h2 class="modal-title fs-3 fw-normal">Add Item</h2>
                        </div>
                        <div class="modal-body">
                            <div class="add-item-detail">
                                <div class="add-item-form p-0">
                                    <div class="col-lg-12 mx-auto">
                                        <!-- Add your form elements here -->
                                        <p>Form to add items will go here.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer mt-5 d-flex justify-content-center">
                            <button type="button" class="btn btn-red hvr-sweep-to-right dark-sweep" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', addItemModal);

        // Fetch schema and generate form
        fetchSchemaAndGenerateForm();
    }
}

async function fetchSchemaAndGenerateForm() {
    try {
        const response = await fetch('/getcolnames/items');
        const schema = await response.json();

        const formHtml = schema.columns.map(column => {
            if (['pictures', 'documents', 'files'].includes(column.name)) {
                return `
                    <div class="mb-3">
                        <label for="${column.name}" class="form-label">${column.name}</label>
                        <input type="file" class="form-control" id="${column.name}" name="${column.name}" multiple>
                        <div id="${column.name}-preview" class="file-preview"></div>
                    </div>
                `;
            }  else if (['createdAt', 'updatedAt', 'itemId' , 'pageId' ].includes(column.name)){

            }else {
                return `
                    <div class="mb-3">
                        <label for="${column.name}" class="form-label">${column.name}</label>
                        <input type="${getInputType(column.type)}" class="form-control" id="${column.name}" name="${column.name}" ${column.type !== 'TIMESTAMP' ? 'required' : ''}>
                    </div>
                `;
            }
        }).join('');

        const formContainer = document.querySelector('#modalAddItem .add-item-form .col-lg-12');
        formContainer.innerHTML = `
            <form id="add-item-form">
                ${formHtml}
                <button type="submit" class="btn btn-red hvr-sweep-to-right dark-sweep">Submit</button>
            </form>
        `;

        document.getElementById('add-item-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const itemId = formData.get('itemId');

            try {
                const response = await fetch(`/update-items/add/${itemId}`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    alert('Item updated successfully!');
                    // Optionally, you can close the modal or refresh the page
                    window.location.reload();
                } else {
                    alert('Failed to update item.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating the item.');
            }
        });

        // Add event listeners for file inputs
        schema.columns.forEach(column => {
            if (['pictures', 'documents', 'files'].includes(column.name)) {
                const fileInput = document.getElementById(column.name);
                const previewContainer = document.getElementById(`${column.name}-preview`);

                fileInput.addEventListener('change', () => {
                    previewFiles(fileInput.files, previewContainer);
                });

                // Enable drag-and-drop sorting
                new Sortable(previewContainer, {
                    animation: 150,
                    ghostClass: 'sortable-ghost'
                });
            }
        });
    } catch (error) {
        console.error('Error fetching schema:', error);
    }
}

function getInputType(type) {
    switch (type) {
        case 'STRING':
            return 'text';
        case 'FLOAT':
            return 'number';
        case 'INTEGER':
            return 'number';
        case 'TIMESTAMP':
            return 'datetime-local';
        default:
            return 'text';
    }
}

function previewFiles(files, container) {
    container.innerHTML = '';
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = "142px"
            img.classList.add('thumbnail');
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function showAdminUpgradePopup() {
    // Remove the current modal
    const currentModal = document.getElementById('modallogin');
    if (currentModal) {
        currentModal.remove();
    }

    // Create the admin upgrade modal
    const adminUpgradeModal = `
        <div class="modal fade" id="modalAdminUpgrade" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-fullscreen-md-down modal-md modal-dialog-centered" role="document">
                <div class="modal-content p-4">
                    <div class="modal-header mx-auto border-0">
                        <h2 class="modal-title fs-3 fw-normal">Admin Upgrade</h2>
                    </div>
                    <div class="modal-body">
                        <div class="admin-upgrade-detail">
                            <div class="admin-upgrade-form p-0">
                                <div class="col-lg-12 mx-auto">
                                    <form id="admin-upgrade-form">
                                        <input type="text" name="upgrade-code" placeholder="Enter Upgrade Code" class="mb-3 ps-3 text-input" required>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer mt-5 d-flex justify-content-center">
                        <button type="button" class="btn btn-red hvr-sweep-to-right dark-sweep" id="submit-upgrade-button">Submit</button>
                        <button type="button" class="btn btn-outline-gray hvr-sweep-to-right dark-sweep" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', adminUpgradeModal);

    // Show the admin upgrade modal

    document.getElementById('submit-upgrade-button').addEventListener('click', async () => {
        const form = document.getElementById('admin-upgrade-form');
        const formData = new FormData(form);

        try {
            const response = await fetch('/auth/admin-upgrade', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert('Admin upgrade successful!');
                // Optionally, you can redirect the user or refresh the page
                window.location.reload();
            } else {
                alert('Failed to upgrade to admin.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while upgrading to admin.');
        }
    });
}

// New function to create a form for editing pages
async function fetchSchemaAndGeneratePageForm(pageId) {
    try {
        const response = await fetch('/getpagesettings');
        const pages = await response.json();

        const searchFormData = new FormData();
        searchFormData.append('inputs', JSON.stringify({
            "advanceSearchValues": [],
            "basicSearch": "",
            "returnAll": "true",
            "sortBy": "default",
            "tableId": "items",
            "orderType": "ascending"
        }));

        // Fetch items using FormData
        const itemsResponse = await fetch('/search', {
            method: 'POST',
            body: searchFormData
        });
        const items = await itemsResponse.json();

        const formHtml = pages.map(page => {
            console.log(page,"page")
            console.log(items,"items")
            const isSection = page.id === "featured-products" || page.id === "latest-products";
            const sectionItems = isSection ? items.map(item => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${item.itemId}" id="${item.itemId}" name="${page.id}">
                    <label class="form-check-label" for="${item.itemId}">
                        ${item.name||item.href}
                    </label>
                </div>
            `).join('') : '';

            return `
                <div class="mb-3">
                    <label for="${page.id}" class="form-label">${page.id}</label>
                    ${isSection ? sectionItems : `<input type="text" class="form-control" id="${page.id}" name="${page.id}" value="${page.content||page.href}">`}
                </div>
            `;
        }).join('');

        const formContainer = document.querySelector('#modalEditPage .edit-page-form .col-lg-12');
        formContainer.innerHTML = `
            <form id="edit-page-form">
                ${formHtml}
                <button type="submit" class="btn btn-red hvr-sweep-to-right dark-sweep">Submit</button>
            </form>
        `;

        document.getElementById('edit-page-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);

            try {
                const response = await fetch(`/update-pages`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    alert('Page updated successfully!');
                    // Optionally, you can close the modal or refresh the page
                    //window.location.reload();
                } else {
                    alert('Failed to update page.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating the page.');
            }
        });
    } catch (error) {
        console.error('Error fetching schema:', error);
    }
}

// Function to show the edit page modal
function showEditPageModal(profileData) {

    document.getElementById("gears-pages-href").style.display = "block"
    // Create the edit page modal
    const editPageModal = `
        <div class="modal fade" id="modalEditPage" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-fullscreen-md-down modal-md modal-dialog-centered" role="document">
                <div class="modal-content p-4">
                    <div class="modal-header mx-auto border-0">
                        <h2 class="modal-title fs-3 fw-normal">Edit Page</h2>
                    </div>
                    <div class="modal-body">
                        <div class="edit-page-detail">
                            <div class="edit-page-form p-0">
                                <div class="col-lg-12 mx-auto">
                                    <!-- Form to edit page will go here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer mt-5 d-flex justify-content-center">
                        <button type="button" class="btn btn-red hvr-sweep-to-right dark-sweep" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', editPageModal);

    // Show the edit page modal
    

    // Fetch schema and generate form
    fetchSchemaAndGeneratePageForm(profileData.pageId);
}