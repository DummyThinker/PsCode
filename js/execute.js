function BlockTree() {
	this.type="block";
	//this.
}

function CodeBuilder(psc_src){	
	
	var lines = psc_src.split("\n");
	
	function genErr(li,text) {
		return `Error at line ${Number(li)+1}:<br/><br/>&gt;&gt;${lines[li]}<br/><br/>${text}`;
	}
	
	finals=[]
	
	for(var l in lines){
		line = lines[l];
		
		tokens = []
		isquote=false
		token=""
		for(var i in line) {
			if(line[i]=='"') {				
				if(!isquote) {
					isquote=true;
					if(token!="") tokens.push(token);
					token='"';
				}
				else {
					isquote=false;
					token+='"';
					if(token!="") tokens.push(token);
					token="";
				}
			}
			else token+=line[i]
		}
		if(token!="") tokens.push(token);
		
		nosptk = [];
		
		for(var i in tokens) {
			var token=tokens[i]
			if(token[0]=='"') {
				nosptk.push(token);
			}
			else {
				var wosp = token.split(" ");
				
				for(var w in wosp) {
					var word=wosp[w];
					if(word.length>0){					
						token=""
						var pushed=false
						for(var q=0;q<word.length;q++) {														
							if(q<word.length-1) {
								if(word[q]==word[q+1]) {
									if(word[q]=='=' || word[q]=='&' || word[q]=='|') {
										if(token!="") nosptk.push(token);										
										nosptk.push(word[q]+word[q]);
										token="";
										q+=2;											
									}
								}
								if((word[q]=='!' && word[q+1]=='=') || ((word[q]=='<' && word[q+1]=='=') || (word[q]=='>' && word[q+1]=='='))) {
									if(token!="") nosptk.push(token);
									nosptk.push(word[q]+word[q+1]);
									token="";
									q+=2;		
								}
							}
							if(q<word.length) {
								if('{}%+-*/=<>!,'.includes(word[q])) {									
									if(token!="") nosptk.push(token);
									token="";					
									nosptk.push(word[q]);										
								}
								else {
									token+=word[q];
								}
							}							
						}
						if(token!="") nosptk.push(token);						
					}
				}				
			}
		}				
		
		//console.log(nosptk);
		for(var x in nosptk) {
			var tk=nosptk[x];
			if(x<nosptk.length-1 && tk=="}") {				
				this.error=genErr(l,"Expected new line after '}'.");
				return;
			}
		}
		if(l==0 && nosptk[0]!="{") {
			this.error=genErr(0,"Expected '{' at the begin of the program.");
			return;
		}
				
		if(l==lines.length-1 && nosptk[nosptk.length-1]!="}") {			
			this.error=genErr(lines.length-1,"Expected '}' at the end of the program.");
			return;
		}			
		
		finals.push.apply(finals,nosptk);
		finals.push("");
	}
	console.log(finals);
	
	// build javascript
	var js = "function program()";
	var symbols = [];
	var i=0;
	while(i<finals.length){	
		console.log(js);
		var token=finals[i];
		//console.log(token)
		if(token=="{" || token=="}") {
			js+=token;
			i++;
			continue;
		}		
		else if(token=="read") {
			i++;			
			if(i<finals.length) {
				var vr="";
				if(!symbols.includes(finals[i])) {
					vr="var ";
					symbols.push(finals[i]);
				}
				js+=vr + `${finals[i]}=__builtin_read_int("${finals[i]}=");`;
				i++;				
				while(i<finals.length && finals[i]==',') {
					vr="";
					if(!symbols.includes(finals[i+1])) {
						vr="var ";
						symbols.push(finals[i+1]);
					}
					js+=vr+`${finals[i+1]}=__builtin_read_int("${finals[i+1]}=");`;				
					i+=2;
				}				
				js+=""
				continue;
			}			
		}
		else if(token=="write") {
			i++;			
			if(i<finals.length) {				
				js+=`__builtin_write(${finals[i]}+" ");`;
				i++;				
				while(i<finals.length && finals[i]==',') {					
					js+=`__builtin_write(${finals[i+1]}+" ");`;			
					i+=2;
				}								
				continue;
			}			
		}
		else if(token=="if" || token=="while") {
			i++;
			var condition = "";
			while(i<finals.length && finals[i]!="{") {
				condition+=finals[i];
				i++;
			}
			js+=`${token}(${condition})`;
			continue;
		}		
		else if(token=="else"){			
			js+="else ";
			i++;
			continue;
		}
		else if(i<finals.length-1 && finals[i+1]=='=') {
			var vr="";
			if(!symbols.includes(finals[i])) {
				vr="var ";
				symbols.push(finals[i]);
			}			
			rhand="";
			i+=2;
			while(i<finals.length-1 && finals[i]!="") {
				rhand+=finals[i];
				i++;
			}
			js+=vr+`${token}=${rhand};`;
			continue;
		}
		else if(token=="") {
			i++;
			continue;
		}
		i++;
	}	
	console.log(js);
	this.js=js;
}

function __builtin_read_int(msg) {
	return parseInt(window.prompt(msg,"0"));
}

function __builtin_write(msg) {
	consoleWrite(msg);
}

function __builtin_writeln() {
	consoleWriteLine("");
}

function consoleClear() {
	document.getElementById("CodeRes").innerHTML="";
}

function consoleWrite(str){
	document.getElementById("CodeRes").innerHTML+=str;
}

function consoleWriteLine(str){
	document.getElementById("CodeRes").innerHTML+=str+"<br/>";
}

function consoleWriteError(str){	
	document.getElementById("CodeRes").innerHTML+=`<span style="color:red">${str}</span><br/>`;
}