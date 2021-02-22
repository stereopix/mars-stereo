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

	var opportunity_sol_date = msd - 46235 - 0.042431;
	var opportunity_sol = Math.floor(opportunity_sol_date);

	var perseverance_sol_date = msd - 52304 - 0.447092;
	var perseverance_sol = Math.floor(perseverance_sol_date);

	var sol;

	sol = document.getElementById("opportunity_sol");
	sol.max = opportunity_sol;
	if (!sol.value) sol.value = opportunity_sol;

	sol = document.getElementById("curiosity_sol");
	sol.max = curiosity_sol;
	if (!sol.value) sol.value = curiosity_sol;

	sol = document.getElementById("perseverance_sol");
	sol.max = perseverance_sol;
	if (!sol.value) sol.value = perseverance_sol;
}

window.addEventListener("DOMContentLoaded", function(event) {
	set_sols_limits();
});
