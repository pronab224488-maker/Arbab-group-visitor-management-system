document.addEventListener('DOMContentLoaded', () => {
    const departmentForm = document.getElementById('departmentForm');
    const deptNameInput = document.getElementById('deptName');
    const deptListContainer = document.getElementById('dept-list');

    // LocalStorage ba Backend theke department load kora
    let departments = JSON.parse(localStorage.getItem('departments')) || ["HR", "IT", "Accounts", "Management"];

    function renderDepartments() {
        deptListContainer.innerHTML = '';
        departments.forEach((dept, index) => {
            const item = document.createElement('div');
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.8); padding: 10px 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);";
            
            item.innerHTML = `
                <span>${dept}</span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editDept(${index})" style="background: #06b6d4; border: none; color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteDept(${index})" style="background: #ef4444; border: none; color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            deptListContainer.appendChild(item);
        });
        localStorage.setItem('departments', JSON.stringify(departments));
    }

    departmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = deptNameInput.value.trim();
        if(val && !departments.includes(val)) {
            departments.push(val);
            deptNameInput.value = '';
            renderDepartments();
        }
    });

    window.deleteDept = function(index) {
        if(confirm("আপনি কি নিশ্চিত এই ডিপার্টমেন্টটি ডিলিট করতে চান?")) {
            departments.splice(index, 1);
            renderDepartments();
        }
    }

    window.editDept = function(index) {
        const newName = prompt("ডিপার্টমেন্টের নতুন নাম লিখুন:", departments[index]);
        if(newName && newName.trim() !== "") {
            departments[index] = newName.trim();
            renderDepartments();
        }
    }

    renderDepartments();
});