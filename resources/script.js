function set_sols_limits() {
	// Based on http://marsclock.com/ by James Tauber
	var d = new Date();

	var tai_offset = 37;
	var millis = d.getTime();
	var jd_ut = 2440587.5 + (millis / 8.64E7);
	var jd_tt = jd_ut + (tai_offset + 32.184) / 86400;
	var j2000 = jd_tt - 2451545.0;
	var msd = (((j2000 - 4.5) / 1.027491252) + 44796.0 - 0.00096);

	var curiosity_lambda = 360 - 137.4;
	var curiosity_sol = Math.floor(msd - curiosity_lambda / 360) - 49268;

	var perseverance_sol_date = msd - 52304 - 0.447092;
	var perseverance_sol = Math.floor(perseverance_sol_date);

	var sol;

	sol = document.getElementById("curiosity_sol");
	sol.max = curiosity_sol;
	if (!sol.value) sol.value = curiosity_sol;

	sol = document.getElementById("perseverance_sol");
	sol.max = perseverance_sol;
	if (!sol.value) sol.value = perseverance_sol;
}

function random_sol(input_name) {
	var input = document.getElementById(input_name);
	if (input) input.value = Math.floor(Math.random() * (Number(input.max) - Number(input.min) + 1) + Number(input.min));
}

function thumb_clicked() {
	var thumb = this;
	var imgL = new Image();
	var imgR = new Image();
	var loaded = 0;
	var cbox = document.getElementById("canvasbox");
	function assemble() {
		loaded += 1;
		if (loaded == 2) {
			loaded = 0;
			var canvas = document.createElement("canvas");
			canvas.width = imgL.width + imgR.width;
			canvas.height = Math.max(imgL.height, imgR.height);
			var ctx = canvas.getContext("2d");
			ctx.drawImage(imgL, 0, 0);
			ctx.drawImage(imgR, canvas.width - imgR.width, 0);
			cbox.textContent = "";
			cbox.appendChild(canvas);
			cbox.appendChild(document.createElement("br"));
			var al = document.createElement("a");
			al.href = imgL.src;
			al.target = "_blank";
			al.textContent = "Left image"
			cbox.appendChild(al);
			cbox.appendChild(document.createElement("br"));
			var ar = document.createElement("a");
			ar.href = imgR.src;
			ar.target = "_blank";
			ar.textContent = "Right image"
			cbox.appendChild(ar);
			cbox.appendChild(document.createElement("br"));
			cbox.appendChild(document.createTextNode(thumb.getAttribute("data-date")));
			cbox.appendChild(document.createElement("br"));
			cbox.appendChild(document.createTextNode(thumb.getAttribute("data-camera")));

		} else if (imgL.complete) {
			cbox.textContent = "Loading right...";
		} else {
			cbox.textContent = "Loading left...";
		}
	}
	imgL.onload = assemble;
	imgR.onload = assemble;
	cbox.textContent = "Loading left & right...";
	imgL.src = thumb.getAttribute('data-l');
	imgR.src = thumb.getAttribute('data-r');

	var thumbs = document.getElementById("thumbs");
	thumbs.classList.add("hidden")
	var athumbs = document.createElement("a");
	athumbs.id = "athumbs";
	athumbs.href = "#";
	athumbs.onclick = function(e) {
		e.preventDefault();
		thumbs.classList.remove("hidden");
		athumbs.remove();
	}
	athumbs.textContent = "↓ Show thumbs ↓";
	thumbs.parentNode.insertBefore(athumbs, thumbs);
}

function add_pairs(pairs, nbraws) {
	pairs.sort(function (a, b) { return a.date.localeCompare(b.date); });
	var thumbs = document.getElementById("thumbs");
	thumbs.textContent = nbraws + " monoscopic photos found, " + pairs.length + " pairs matched.";
	thumbs.appendChild(document.createElement("br"));
	for (var i in pairs) {
		p = pairs[i];
		var img = document.createElement("img");
		img.src = p.t;
		img.title = p.camera + " " + p.date;
		img.onclick = thumb_clicked;
		img.setAttribute("data-l", p.l);
		img.setAttribute("data-r", p.r);
		img.setAttribute("data-date", p.date);
		img.setAttribute("data-camera", p.camera);
		thumbs.appendChild(img);
	}
}

function curiosity_scrap(e) {
	e.preventDefault();
	var cams = [];
	var camssearch = "";
	if (document.getElementById("curiosity_cam_nav").checked) cams.push("Navcam"), camssearch += "NAV_LEFT_A|NAV_RIGHT_A|NAV_LEFT_B|NAV_RIGHT_B|";
	if (document.getElementById("curiosity_cam_fhaz").checked) cams.push("Front Hazcam"), camssearch += "FHAZ_LEFT_A|FHAZ_RIGHT_A|FHAZ_LEFT_B|FHAZ_RIGHT_B|";
	if (document.getElementById("curiosity_cam_rhaz").checked) cams.push("Rear Hazcam"), camssearch += "RHAZ_LEFT_A|RHAZ_RIGHT_A|RHAZ_LEFT_B|RHAZ_RIGHT_B|";
	var sol = document.getElementById("curiosity_sol").value;
	document.getElementById("title").textContent = "Curiosity Sol "+sol+"\n("+cams.join(" + ")+")";

	if (cams == "") {
		document.getElementById("curiosity_cam_nav").checked = true;
		document.getElementById("curiosity_cam_fhaz").checked = true;
		document.getElementById("curiosity_cam_rhaz").checked = true;
		curiosity_scrap(e);
		return;
	}

	var thumbs = document.getElementById("thumbs");
	thumbs.classList.remove("hidden");
	thumbs.textContent = "Loading...";
	document.getElementById("canvasbox").textContent = "";
	var athumbs = document.getElementById("athumbs"); athumbs && athumbs.remove();
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		data = JSON.parse(xhr.responseText);
		if (data.items.length == 0) thumbs.textContent = "No photos found.";
		else {
			var pairs = []
			for (var i = 0; i < data.items.length; i++) {
				var item1 = data.items[i];
				for (var j = i+1; j < data.items.length; j++) {
				var item2 = data.items[j];
					if (item1['sol'] != item2['sol']) break
					if (item1['date_taken'] == item2['date_taken']) {
						var inst1 = item1['instrument'].split('_');
						var inst2 = item2['instrument'].split('_');
						if (inst1[0] == inst2[0] && inst1[2] == inst2[2]) {
							p = {
								't': item1.url.replace(".JPG", "-thm2.jpg"),
								'l': item1.url,
								'r': item2.url,
								'camera': inst1[0]+'_'+inst1[2],
								'date': item1.date_taken,
							}
							if (inst1[1] == 'RIGHT') {
								p.l = item2.url
								p.r = item1.url
							}
							pairs.push(p)
							break
						}
					}
				}
			}
			add_pairs(pairs, data.items.length);
		}
	};
	xhr.onerror = function() {
		thumbs.textContent = "Error while loading.";
	}
	var url = new URL("/api/curiosity.json", document.location);
	url.search = new URLSearchParams({
		"order": "date_taken desc",
		"per_page": 2500,
		"page": 0,
		"condition_1": "msl:mission",
		"condition_2": sol+":sol:gte",
		"condition_3": sol+":sol:lte",
		"search": camssearch,
		"extended": "full::sample_type",
	});
	xhr.open("GET", url.toString(), true);
	xhr.send();
}

function perseverance_scrap(e) {
	e.preventDefault();
	var cams = [];
	var camssearch = "";
	if (document.getElementById("perseverance_cam_mast").checked) cams.push("Mastcam"), camssearch += "MCZ_LEFT|MCZ_RIGHT|";
	if (document.getElementById("perseverance_cam_nav").checked) cams.push("Navcam"), camssearch += "NAVCAM_LEFT|NAVCAM_RIGHT|";
	if (document.getElementById("perseverance_cam_fhaz").checked) cams.push("Front Hazcam"), camssearch += "FRONT_HAZCAM_LEFT_A|FRONT_HAZCAM_RIGHT_A|FRONT_HAZCAM_LEFT_B|FRONT_HAZCAM_RIGHT_B|";
	if (document.getElementById("perseverance_cam_rhaz").checked) cams.push("Rear Hazcam"), camssearch += "REAR_HAZCAM_LEFT|REAR_HAZCAM_RIGHT|";
	var sol = document.getElementById("perseverance_sol").value;
	document.getElementById("title").textContent = "Perseverance Sol "+sol+"\n("+cams.join(" + ")+")";

	if (cams == "") {
		document.getElementById("perseverance_cam_mast").checked = true;
		document.getElementById("perseverance_cam_nav").checked = true;
		document.getElementById("perseverance_cam_fhaz").checked = true;
		document.getElementById("perseverance_cam_rhaz").checked = true;
		perseverance_scrap(e);
		return;
	}

	var thumbs = document.getElementById("thumbs");
	thumbs.classList.remove("hidden");
	thumbs.textContent = "Loading...";
	document.getElementById("canvasbox").textContent = "";
	var athumbs = document.getElementById("athumbs"); athumbs && athumbs.remove();
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		data = JSON.parse(xhr.responseText);
		if (data.images.length == 0) thumbs.textContent = "No photos found.";
		else {
			var pairs = []
			for (var i = 0; i < data.images.length; i++) {
				var item1 = data.images[i];
				for (var j = i+1; j < data.images.length; j++) {
				var item2 = data.images[j];
					if (item1['sol'] != item2['sol']) break
					if (item1['imageid'].substring(item1['imageid'].indexOf('_')) == item2['imageid'].substring(item2['imageid'].indexOf('_'))) {
						var inst1 = item1['camera']['instrument'].split('_');
						var inst2 = item2['camera']['instrument'].split('_');
						if (inst1[0] == inst2[0] && (inst1.length != 4 || inst1[3] == inst2[3])) {
							p = {
								't': item1.image_files.small,
								'l': item1.image_files.full_res,
								'r': item2.image_files.full_res,
								'camera': inst1[0].replace('_LEFT', '').replace('_RIGHT', ''),
								'date': item1.date_taken_utc,
							}
							if ((inst1.length == 2 && inst1[1] == 'RIGHT') || inst1[2] == 'RIGHT') {
								p.t = item2.image_files.small
								p.l = item2.image_files.full_res
								p.r = item1.image_files.full_res
							}
							pairs.push(p)
							break
						}
					}
				}
			}
			add_pairs(pairs, data.images.length);
		}
	};
	xhr.onerror = function() {
		thumbs.textContent = "Error while loading.";
	}
	var url = new URL("https://mars.nasa.gov/rss/api/", document.location);
	url.search = new URLSearchParams({
		"feed": "raw_images",
		"category": "mars2020",
		"feedtype": "json",
		"num": 2500,
		"page": 0,
		"search": camssearch,
		"condition_2": sol+":sol:gte",
		"condition_3": sol+":sol:lte",
		"extended": "sample_type::full",
	});
	xhr.open("GET", url.toString(), true);
	xhr.send();
}

window.addEventListener("DOMContentLoaded", function(event) {
	set_sols_limits();
	document.getElementById("curiosity_form").addEventListener('submit', curiosity_scrap);
	document.getElementById("perseverance_form").addEventListener('submit', perseverance_scrap);
});
