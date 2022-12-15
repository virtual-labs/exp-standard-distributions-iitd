"use strict";

//HELPER FUNCTIONS
function round(x){
	return Math.round(x*1000)/1000;
}

//GRAPH FUNCTIONS
function distGraph(p1, p2, dist='und', dis=true){
	let x = [], y = [];

	let [start, end] = Limits.get(dist)(p1, p2);
	let freq = (dis? 1: DENSITY), gap = 1/freq;

	start = Math.ceil(start * freq);
	end = Math.trunc(end * freq);

	let total = 0;
	for(let i = start; i <= end && (isFinite(end) || total <= MAXP); i++){
		x.push(i*gap);
		y.push(Dist.get(dist)(i*gap, p1, p2));
		total += y.at(-1);
	}

	return {
		name: "Theoretical",
		x: x, y: y,
		mode: (dis? 'markers': 'lines'),
		type: 'scatter'
	};
}

function randGraph(p1, p2, dist='und', dis=true){
	if(dis){
		const m = new Map();
		for(let i = 0; i < TRIALS; i++){
			let v = Rand.get(dist)(p1, p2);
			let cnt = (m.has(v)? m.get(v): 0);
			m.set(v, cnt+1);
		}
		const x = Array.from(m.keys());
		const y = (Array.from(m.values())).map((x) => x/TRIALS);

		return{
			name: "Randomized",
			type: 'bar',
			x: x, y: y,
			width: 0.4
		}
	}

	const res = [];
	for(let i = 0; i < TRIALS; i++){
		res.push(Rand.get(dist)(p1, p2));
	}

	return {
		name: "Randomized",
		x: res,
		type: 'histogram',
		histnorm: 'probability density'
	};
}

//MAIN FUNCTIONS
function validate(choice){
	if(choice == ""){
		throw ("Please choose a distribution.");
	}

	//Validation of inputed parameters
	let p1 = document.getElementById('p1').value;
	let p2 = document.getElementById('p2').value;

	if(p1 == '' || (parameter2.has(choice) && p2 == '')){
		throw ("Please enter the required parameters.");
	}

	if(isNaN(p1) || isNaN(p2)){
		throw ("Please enter only numbers as parameters.");
	}

	p1 = parseFloat(p1);
	p2 = parseFloat(p2);

	if((p1 < 0) && !neg_para.includes(choice+'_p1')){
		throw ("The first parameter must be non-negative.");
	}

	if((p2 < 0) && !neg_para.includes(choice+'_p2')){
		throw ("The second parameter must be non-negative.");
	}

	if((choice == 'geo' || choice == 'bin') && (p1 > 1)){
		throw ("Success probability must be below 1.");
	}

	if(int_para.includes(choice+'_p1') && !(Number.isInteger(p1))){
		throw ("The first parameter must be an integer");
	}

	if(int_para.includes(choice+'_p2') && !(Number.isInteger(p2))){
		throw ("The second parameter must be an integer");
	}

	if((choice == 'unc') && (p1 > p2)){
		throw ("The first parameter must be smaller than or equal to the second parameter")
	}

	if((choice == 'und') && (p1 >= p2)){
		throw ("The first parameter must be smaller than the second parameter")
	}

	return [p1, p2];
}

function PDF(){
	const choice = select.options[select.selectedIndex].value;
	const discrete = disc.includes(choice);

	layout.yaxis.title = "Probability " + (discrete? "Mass": "Density");

	try{
		const [p1, p2] = validate(choice);

		//Graphing
		let theo = document.getElementById('theo').checked;
		let rand = document.getElementById('rand').checked;

		let graph = [];

		if(theo){
			graph.push(distGraph(p1, p2, choice, discrete));
		}

		if(rand){
			graph.push(randGraph(p1, p2, choice, discrete));
		}

		Plotly.newPlot(canvas, graph, layout);
		outputMoments(choice, p1, p2);
	}catch(e){
		alert(e);
	}
}

function change(){
	let choice = select.options[select.selectedIndex].value;

	const elements = document.getElementsByClassName('hidden');
	while(elements.length > 0) {elements[0].classList.remove('hidden');}

	const p1l = document.getElementById('p1l');
	const p1 = document.getElementById('p1');

	const p2l = document.getElementById('p2l');
	const p2 = document.getElementById('p2');

	p1l.innerHTML = "\\( " + parameter1.get(choice) + " = \\)";
	p1.value = default_p1.get(choice);

	if(parameter2.has(choice)){
		p2l.innerHTML = "\\( " + parameter2.get(choice) + " = \\)";
		p2.value = default_p2.get(choice);
	}
	else{
		p2l.classList.add('hidden');
		p2.classList.add('hidden');
	}

	MathJax.typeset([p1l, p2l]);

	//Probability at point or range
	const prl = document.getElementById('prl');
	prl.innerHTML = (disc.includes(choice)? '\\(P(X = x) = \\)': '\\(f(x) = \\)');
	MathJax.typeset([prl]);

	document.getElementById('x').value = "";
	document.getElementById('pr').value = "";
	
	document.getElementById('minx').value = "";
	document.getElementById('maxx').value = "";
	document.getElementById('rpr').value = "";

	// Function
	const func = document.getElementById('func');
	func.innerHTML = "\\[ " + proFunc.get(choice) + " \\]";
	MathJax.typeset([func]);
}

function outputMoments(choice, p1=0, p2=0){
	const mom = document.getElementById('moments')
	let txt = "";
	let mean = Mean.get(choice)(p1, p2);
	let variance = Variance.get(choice)(p1, p2);

	mean = (mean == "Undefined"? mean: round(mean));
	variance = (variance == "Undefined"? variance:round(variance));

	txt += "\\(\\mu = E(X) = " + mean + "\\hspace{2cm}\\)";
	txt += "\\(\\sigma^2 = Var(X) = " + variance + "\\)";
	
	mom.innerHTML = txt;
	MathJax.typeset([mom]);
}

function outputProbability(){
	const choice = select.options[select.selectedIndex].value;

	try{
		const [p1, p2] = validate(choice);
		let x = document.getElementById('x').value;

		if(isNaN(x)){
			throw ("Please enter a number.");
		}

		document.getElementById('pr').value = (x == ""? "": Dist.get(choice)(parseFloat(x), p1, p2).toFixed(6));
	}catch(e){
		alert(e);
	}
}

function outputCumulativeProbability(){
	const choice = select.options[select.selectedIndex].value;

	try{
		const [p1, p2] = validate(choice);
		let x = document.getElementById('x').value;

		if(isNaN(x)){
			throw ("Please enter a number.");
		}

		document.getElementById('pr').value = (x == ""? "": cDist.get(choice)(parseFloat(x), p1, p2).toFixed(6));
	}catch(e){
		alert(e);
	}
}

function outputRangeProbability(){
	const choice = select.options[select.selectedIndex].value;

	try{
		const [p1, p2] = validate(choice);
		let minx = document.getElementById('minx').value;
		let maxx = document.getElementById('maxx').value;

		if(isNaN(minx) || isNaN(maxx)){
			throw ("Please enter a number.");
		}

		if(minx == "" && maxx == ""){
			document.getElementById('rpr').value = "";
		}
		else{
			let start = 0, end = 1;
			if(minx != ""){
				start = cDist.get(choice)(parseFloat(minx), p1, p2);
			}
			if(maxx != ""){
				end = cDist.get(choice)(parseFloat(maxx), p1, p2);
			}

			document.getElementById('rpr').value = (end - start).toFixed(6);
		}
	}catch(e){
		alert(e);
	}
}