examples = {	
	"evenodd": '{\n\tread n\n\tif n%2==0 {\n\t\twrite n, "is even"\n\t}\n\telse {\n\t\twrite n, "is odd"\n\t}\n\tendif\n}',
	"gcd": '{\n\tread a,b\n\twrite "gcd(",a,",",b,") = "\n\twhile b!=0 {\n\t\tr = a % b\n\t\ta = b\n\t\tb = r\n\t}\n\twrite a\n}'
};    

for(var name in examples) {
	var opt=document.createElement("option");
	opt.innerHTML=opt.value=name;
	document.getElementById("ExBox").appendChild(opt);
}

document.getElementById("ExBox").onchange = function(){
	var name=document.getElementById("ExBox").value;
	source.value=examples[name].replaceAll("\t","    ");
	beautify();	
	document.getElementById("ExBox").selectedIndex = 0;
	
	debugging=true;
	document.getElementById("RunBtn").click();
}