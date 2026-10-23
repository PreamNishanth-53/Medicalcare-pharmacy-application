const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n || 0).toFixed(2);
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let medicines = [
    {id:1,name:"Paracetamol 500mg",barcode:"890100001",category:"Tablet",batch:"PCM101",quantity:100,cost:2,price:3,gst:5,expiry:"2027-12-31",minimum:20},
    {id:2,name:"Amoxicillin 250mg",barcode:"890100002",category:"Capsule",batch:"AMX201",quantity:60,cost:5,price:8,gst:5,expiry:"2027-08-30",minimum:15},
    {id:3,name:"Vitamin C Tablets",barcode:"890100003",category:"Tablet",batch:"VTC301",quantity:8,cost:3,price:5,gst:5,expiry:"2027-01-15",minimum:10},
    {id:4,name:"Cough Syrup 100ml",barcode:"890100004",category:"Syrup",batch:"CS401",quantity:30,cost:35,price:50,gst:12,expiry:"2026-11-15",minimum:10},
    {id:5,name:"Expired Sample Medicine",barcode:"890100005",category:"Tablet",batch:"EXP501",quantity:5,cost:4,price:6,gst:5,expiry:"2026-01-01",minimum:10}
];
let suppliers=[], purchases=[], sales=[], cart=[];
let medId=6, supplierId=1, invoiceId=1001;

function notify(msg) {
    $("toast").textContent=msg;
    $("toast").classList.add("show");
    clearTimeout(notify.timer);
    notify.timer=setTimeout(()=>$("toast").classList.remove("show"),3000);
}
function expired(m) { return m.expiry < today(); }
function nearExpiry(m) {
    const days=(new Date(m.expiry+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000;
    return days>=0 && days<=90;
}
function low(m) { return m.quantity<=m.minimum; }
function status(m) {
    if(expired(m)) return '<span class="badge bad">Expired</span>';
    if(nearExpiry(m)) return '<span class="badge warn">Near Expiry</span>';
    if(low(m)) return '<span class="badge warn">Low Stock</span>';
    return '<span class="badge good">In Stock</span>';
}
function canSell(m) { return !expired(m) && m.quantity>0; }

function go(page) {
    if(!$ (page)) return;
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));
    document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
    const link=document.querySelector(`nav a[data-page="${page}"]`);
    $("page-title").textContent=link ? link.textContent.trim().replace(/^[▦▤▣⇩♙▧▥▨]\s*/,"") : "Dashboard";
    history.replaceState(null,"","#"+page);
    if(page==="billing") renderBillResults($("bill-search").value);
    if(page==="reports") renderReports();
}
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();go(a.dataset.page)}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

function renderInventory() {
    const q=$("inventory-search").value.toLowerCase(), f=$("stock-filter").value;
    const list=medicines.filter(m=>{
        if(!(`${m.name} ${m.barcode} ${m.batch}`.toLowerCase().includes(q))) return false;
        if(f==="low") return low(m);
        if(f==="expiry") return expired(m)||nearExpiry(m);
        return true;
    });
    $("inventory-table").innerHTML=list.map(m=>`<tr><td>${safe(m.name)}<br><small>${safe(m.category)}</small></td><td>${safe(m.barcode)}</td><td>${safe(m.batch)}</td><td>${m.quantity}</td><td>${money(m.price)}</td><td>${safe(m.expiry)}</td><td>${status(m)}</td><td><button class="danger-btn" data-delete="${m.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="8">No medicines found.</td></tr>';
    $("total-medicines").textContent=medicines.length;
    $("total-stock").textContent=medicines.reduce((s,m)=>s+m.quantity,0);
    $("low-count").textContent=medicines.filter(low).length;
    $("expiry-count").textContent=medicines.filter(m=>expired(m)||nearExpiry(m)).length;
    $("dashboard-alerts").innerHTML=medicines.filter(m=>low(m)||expired(m)||nearExpiry(m)).map(m=>`<tr><td>${safe(m.name)}</td><td>${safe(m.batch)}</td><td>${m.quantity}</td><td>${safe(m.expiry)}</td><td>${status(m)}</td></tr>`).join("")||'<tr><td colspan="5">No alerts.</td></tr>';
    $("report-table").innerHTML=medicines.map(m=>`<tr><td>${safe(m.name)}</td><td>${safe(m.batch)}</td><td>${m.quantity}</td><td>${money(m.quantity*m.cost)}</td><td>${safe(m.expiry)}</td><td>${status(m)}</td></tr>`).join("");
}
$("show-med").onclick=()=>$("med-form").classList.toggle("hidden");
$("cancel-med").onclick=()=>$("med-form").classList.add("hidden");
$("med-form").onsubmit=e=>{
    e.preventDefault();
    const m={id:medId++,name:$("med-name").value.trim(),barcode:$("med-barcode").value.trim(),category:$("med-category").value.trim(),batch:$("med-batch").value.trim(),quantity:Number($("med-qty").value),cost:Number($("med-cost").value),price:Number($("med-price").value),gst:Number($("med-gst").value),expiry:$("med-expiry").value,minimum:Number($("med-min").value)};
    if(medicines.some(x=>x.barcode===m.barcode)){notify("Barcode already exists.");return;}
    if(!m.name||!m.batch||!m.expiry||m.price<=0||m.cost<0||m.quantity<0||m.gst<0||m.gst>100||m.minimum<0){notify("Check medicine details.");return;}
    medicines.push(m);e.target.reset();e.target.classList.add("hidden");refresh();notify("Medicine added to demo inventory.");
};
$("inventory-search").oninput=renderInventory;
$("stock-filter").onchange=renderInventory;
$("inventory-table").onclick=e=>{
    const b=e.target.closest("[data-delete]");if(!b)return;
    const id=Number(b.dataset.delete);
    if(cart.some(x=>x.id===id)||purchases.some(x=>x.medicineId===id)||sales.some(s=>s.items.some(x=>x.id===id))){notify("Medicine has transaction history.");return;}
    if(confirm("Delete this medicine?")){medicines=medicines.filter(m=>m.id!==id);refresh();}
};

function renderBillResults(q="") {
    const list=medicines.filter(m=>`${m.name} ${m.barcode}`.toLowerCase().includes(q.trim().toLowerCase()));
    $("bill-results").innerHTML=list.map(m=>`<div class="result"><div><strong>${safe(m.name)}</strong><p>Batch ${safe(m.batch)} · Stock ${m.quantity} · MRP ${money(m.price)}</p>${status(m)}</div><button class="primary" data-add="${m.id}" ${canSell(m)?"":"disabled"}>Add</button></div>`).join("")||"<p>No matching medicines.</p>";
}
$("bill-search").oninput=e=>renderBillResults(e.target.value);
$("bill-results").onclick=e=>{
    const b=e.target.closest("[data-add]");if(!b)return;
    const m=medicines.find(x=>x.id===Number(b.dataset.add));if(!m||!canSell(m)){notify("Expired or unavailable stock.");return;}
    let item=cart.find(x=>x.id===m.id);
    if(item){if(item.quantity+1>m.quantity){notify("Insufficient stock.");return;}item.quantity++;}
    else cart.push({...m,quantity:1});
    renderCart();
};
function line(item) {
    const subtotal=item.price*item.quantity;
    const tax=subtotal*item.gst/100;
    return {subtotal,tax,total:subtotal+tax};
}
function renderCart() {
    $("cart-table").innerHTML=cart.map(i=>{const t=line(i);return `<tr><td>${safe(i.name)}<br><small>${safe(i.batch)}</small></td><td><input data-qty="${i.id}" type="number" min="1" max="${i.quantity}" value="${i.quantity}" style="width:70px"></td><td>${money(i.price)}</td><td>${i.gst}% (${money(t.tax)})</td><td>${money(t.total)}</td><td><button class="danger-btn" data-remove="${i.id}">Remove</button></td></tr>`}).join("")||'<tr><td colspan="6">Cart is empty.</td></tr>';
    const sub=cart.reduce((s,i)=>s+line(i).subtotal,0),tax=cart.reduce((s,i)=>s+line(i).tax,0);
    $("subtotal").textContent=money(sub);$("tax").textContent=money(tax);$("grand-total").textContent=money(sub+tax);
}
$("cart-table").onchange=e=>{
    const input=e.target.closest("[data-qty]");if(!input)return;
    const i=cart.find(x=>x.id===Number(input.dataset.qty)),q=Number(input.value);
    if(!i)return;if(!Number.isInteger(q)||q<1||q>i.quantity){notify("Invalid quantity.");renderCart();return;}
    i.quantity=q;renderCart();
};
$("cart-table").onclick=e=>{const b=e.target.closest("[data-remove]");if(b){cart=cart.filter(i=>i.id!==Number(b.dataset.remove));renderCart();}};
$("checkout").onclick=()=>{
    if(!cart.length){notify("Cart is empty.");return;}
    for(const i of cart){const m=medicines.find(x=>x.id===i.id);if(!m||!canSell(m)||i.quantity>m.quantity){notify("Insufficient or expired stock.");return;}}
    const items=cart.map(i=>({...i}));
    const sub=items.reduce((s,i)=>s+line(i).subtotal,0),tax=items.reduce((s,i)=>s+line(i).tax,0);
    items.forEach(i=>medicines.find(m=>m.id===i.id).quantity-=i.quantity);
    const sale={invoice:"INV-"+invoiceId++,date:today(),items,subtotal:sub,tax,total:sub+tax,payment:$("payment").value};
    sales.unshift(sale);cart=[];renderCart();refresh();notify("Sale completed: "+sale.invoice);
    if(confirm("Print this demo invoice?"))printInvoice(sale);
};
function printInvoice(s) {
    const w=window.open("","_blank");if(!w){notify("Allow pop-ups to print.");return;}
    w.document.write(`<html><head><title>${safe(s.invoice)}</title><style>body{font-family:Arial;padding:25px;color:#17365d}table{width:100%;border-collapse:collapse}td,th{padding:10px;border:1px solid #ddd;text-align:left}</style></head><body><h1>MediCare Pharmacy</h1><p>DEMO INVOICE — NOT A PRODUCTION TAX INVOICE</p><p>${safe(s.invoice)} | ${safe(s.date)}</p><table><tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Tax</th><th>Total</th></tr>${s.items.map(i=>`<tr><td>${safe(i.name)}</td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(line(i).tax)}</td><td>${money(line(i).total)}</td></tr>`).join("")}</table><p>Subtotal: ${money(s.subtotal)}</p><p>GST: ${money(s.tax)}</p><h2>Total: ${money(s.total)}</h2><p>Payment: ${safe(s.payment)}</p><script>window.onload=()=>window.print();<\/script></body></html>`);w.document.close();
};

$("show-supplier").onclick=()=>$("supplier-form").classList.toggle("hidden");
function renderSuppliers(){
    const q=$("supplier-search").value.toLowerCase();
    $("supplier-table").innerHTML=suppliers.filter(s=>`${s.name} ${s.phone} ${s.gstin}`.toLowerCase().includes(q)).map(s=>`<tr><td>${safe(s.name)}</td><td>${safe(s.contact||"-")}</td><td>${safe(s.phone)}</td><td>${safe(s.email||"-")}</td><td>${safe(s.gstin||"-")}</td></tr>`).join("")||'<tr><td colspan="5">No suppliers added.</td></tr>';
}
$("supplier-form").onsubmit=e=>{
    e.preventDefault();suppliers.push({id:supplierId++,name:$("sup-name").value.trim(),contact:$("sup-contact").value.trim(),phone:$("sup-phone").value.trim(),email:$("sup-email").value.trim(),gstin:$("sup-gstin").value.trim(),address:$("sup-address").value.trim()});e.target.reset();e.target.classList.add("hidden");renderSuppliers();notify("Supplier added.");
};
$("supplier-search").oninput=renderSuppliers;

$("purchase-form").onsubmit=e=>{
    e.preventDefault();
    const name=$("pur-name").value.trim(),batch=$("pur-batch").value.trim(),qty=Number($("pur-qty").value),cost=Number($("pur-cost").value),mrp=Number($("pur-mrp").value),expiry=$("pur-expiry").value;
    if(!Number.isInteger(qty)||qty<1||cost<=0||mrp<=0||!expiry){notify("Enter valid purchase details.");return;}
    if(expiry<today()){notify("Cannot receive expired stock.");return;}
    let m=medicines.find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.batch===batch);
    if(m){
        if(m.price!==mrp||m.expiry!==expiry){notify("Batch MRP or expiry differs.");return;}
        m.quantity+=qty;m.cost=cost;
    }else{
        m=medicines.find(x=>x.name.toLowerCase()===name.toLowerCase());
        if(m){notify("Use a new medicine record for a different batch in this demo.");return;}
        m={id:medId++,name,barcode:"DEMO-"+Date.now(),category:"General",batch,quantity:qty,cost,price:mrp,gst:5,expiry,minimum:10};
        medicines.push(m);
    }
    purchases.unshift({invoice:$("pur-invoice").value.trim(),supplier:$("pur-supplier").value.trim(),medicine:name,medicineId:m.id,batch,quantity:qty,total:qty*cost,date:today()});
    e.target.reset();renderPurchases();refresh();notify("Purchase recorded and stock updated.");
};
function renderPurchases(){
    $("purchase-table").innerHTML=purchases.map(p=>`<tr><td>${safe(p.invoice)}</td><td>${safe(p.supplier)}</td><td>${safe(p.medicine)}</td><td>${safe(p.batch)}</td><td>${p.quantity}</td><td>${money(p.total)}</td><td>${safe(p.date)}</td></tr>`).join("")||'<tr><td colspan="7">No purchases recorded.</td></tr>';
}

function renderSales(){
    const q=$("sales-search").value.toLowerCase(),date=$("sales-date").value;
    const list=sales.filter(s=>s.invoice.toLowerCase().includes(q)&&(!date||s.date===date));
    $("sales-table").innerHTML=list.map(s=>`<tr><td>${safe(s.invoice)}</td><td>${safe(s.date)}</td><td>${s.items.reduce((n,i)=>n+i.quantity,0)}</td><td>${safe(s.payment)}</td><td>${money(s.subtotal)}</td><td>${money(s.tax)}</td><td>${money(s.total)}</td></tr>`).join("")||'<tr><td colspan="7">No sales found.</td></tr>';
    $("recent-sales").innerHTML=sales.slice(0,5).map(s=>`<tr><td>${safe(s.invoice)}</td><td>${safe(s.date)}</td><td>${s.items.reduce((n,i)=>n+i.quantity,0)}</td><td>${safe(s.payment)}</td><td>${money(s.total)}</td></tr>`).join("")||'<tr><td colspan="5">No sales recorded.</td></tr>';
    $("today-sales").textContent=money(sales.filter(s=>s.date===today()).reduce((n,s)=>n+s.total,0));
}
$("sales-search").oninput=renderSales;$("sales-date").onchange=renderSales;

$("barcode-form").onsubmit=e=>{
    e.preventDefault();const code=$("barcode-input").value.trim(),m=medicines.find(x=>x.barcode===code);
    if(!m){$("barcode-result").innerHTML="<p>Medicine not found.</p>";return;}
    $("barcode-result").innerHTML=`<div class="panel" style="margin-top:20px;text-align:left"><h3>${safe(m.name)}</h3><p>Barcode: ${safe(m.barcode)}</p><p>Batch: ${safe(m.batch)}</p><p>Quantity: ${m.quantity}</p><p>MRP: ${money(m.price)}</p><p>Expiry: ${safe(m.expiry)}</p><p>${status(m)}</p><button id="barcode-add" class="primary" ${canSell(m)?"":"disabled"}>Add to Billing</button></div>`;
    $("barcode-add").onclick=()=>{go("billing");$("bill-search").value=m.barcode;renderBillResults(m.barcode);const b=$("bill-results").querySelector("[data-add]");if(b&&!b.disabled)b.click();};
};

function renderReports(){
    $("report-sales").textContent=money(sales.reduce((n,s)=>n+s.total,0));
    $("report-purchases").textContent=money(purchases.reduce((n,p)=>n+p.total,0));
    $("report-value").textContent=money(medicines.reduce((n,m)=>n+m.quantity*m.cost,0));
}
$("export").onclick=()=>{
    const rows=[["Medicine","Barcode","Batch","Quantity","Purchase Price","MRP","Expiry"],...medicines.map(m=>[m.name,m.barcode,m.batch,m.quantity,m.cost,m.price,m.expiry])];
    const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="pharmacy-inventory.csv";a.click();URL.revokeObjectURL(url);
};
function refresh(){renderInventory();renderSuppliers();renderPurchases();renderSales();renderReports();renderCart();}
refresh();renderBillResults();
const initial=location.hash.slice(1);
go(document.getElementById(initial)?.classList.contains("page")?initial:"dashboard");
