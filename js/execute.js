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
								if('{}()%+-*/=<>!,'.includes(word[q])) {									
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
	
	this.symbols={};
	for(var i in finals) {
		if(!keywords.includes(finals[i]) && !("{}()%+-/*=<>!,".includes(finals[i])) &&
				finals[i]!="for" && !isNumeric(finals[i]) && !["||","==","!=","<=",">=","&&"].includes(finals[i]) && finals[i][0]!='"') {			
			this.symbols[finals[i]]=0;
			finals[i]=`$__sym["${finals[i]}"]`;
		}
	}	
	
	this.finals=finals;	
		
	console.log(this.finals);
	
	this.processed = [];
			
	var symbols = [];
	var i=0;
	while(i<finals.length){			
		var token=finals[i];
		
		if(token=="{") {
			this.processed.push("{");
			i++;
			continue;
		}		
		else if(token=="}") {					
			this.processed.push("}");
			i++;
			continue;
		}
		else if(token=="read") {		
			this.processed.push("read")
			i++;			
			if(i<finals.length) {
				var lst=[finals[i]]								
				i++;				
				while(i<finals.length && finals[i]==',') {										
					lst.push(finals[i+1])
					i+=2;
				}				
				this.processed.push(lst)				
				continue;
			}			
		}
		else if(token=="write") {			
			this.processed.push("write")
			i++;			
			if(i<finals.length) {	
				var lst=[]
				lst.push(finals[i])				
				i++;				
				while(i<finals.length && finals[i]==',') {										
					lst.push(finals[i+1])
					i+=2;
				}						
				this.processed.push(lst);
				continue;
			}			
		}
		else if(token=="if" || token=="while") {			
			this.processed.push(token);
			var condition=""			
			i++;			
			while(i<finals.length && finals[i]!="do" && finals[i]!="then" && finals[i]!="" && finals[i]!="{") {
				condition+=finals[i];				
				i++;
			}			
			this.processed.push(condition);
			if(finals[i]=="do" && token=="if") {
				this.error='"if... do" is not a statement.';
				return;
			}
			if(finals[i]=="then" && token=="while") {
				this.error='"while... then" is not a statement.';
				return;
			}			
			continue;
		}		
		else if(token=="else"){		
			this.processed.push("else");								
			i++;
			continue;
		}
		else if(i<finals.length-1 && finals[i+1]=='=') {			
			rhand="";
			i+=2;
			while(i<finals.length-1 && finals[i]!="") {
				rhand+=finals[i];
				i++;
			}
			this.processed.push(`${token}=${rhand}`)			
			continue;
		}
		else if(finals[i]=="do" && finals[i+1]=="for") {
			var it="";
			var start="";
			var stop="";
			var step="";
			i+=2;
			while(finals[i]!='=') {
				it+=finals[i]; i++;
			}
			i++;
			while(finals[i]!=",") {
				start+=finals[i]; i++;
			}
			i++;
			while(finals[i]!=",") {
				stop+=finals[i]; i++;
			}
			i++;
			while(finals[i]!="{") {
				step+=finals[i]; i++;
			}			
			this.processed.push("for");
			var lst=[]
			lst.push(it);
			lst.push(start);
			lst.push(stop);
			lst.push(step);
			this.processed.push(lst)
			continue;
		}
		else if(token=="") {
			i++;
			continue;
		}
		i++;
	}	
	
	console.log(this.processed);
	
	this.crt=null;	
	this.interval = null;	
	
	this.execute = function() {
		if(this.error!="") {
			return;
		}
		var self=this;
		this.crt=this.tree;	
		var crt=this.crt;			
		var stack = [ this.tree.children[0] ];		
		
		this.interval = setInterval(function(){
			
		},1);		
	}
	
	this.stop = function() {		
		clearInterval(this.interval);
		this.crt=this.tree;
	}
	
}

function InstructionTree(parent=null) {	
	this.parent=parent;
	if(parent!=null) {
		parent.children.push(this);
	}
	this.condition="";
	this.name=null;
	this.args=[];
	this.children=[];	
	this.blockNext=false;
	
	this.next=function() {
		if(this.blockNext) {			
			return null;
		}
		if(this.parent==null) {			
			return null;
		}
		var children=this.parent.children;
		index = children.indexOf(this);
		if(index >= 0 && index < children.length - 1) {			
			return  children[index + 1];
		}		
		return null;
	}
	
	this.checkCondition=function(symbols) {
		$__sym=symbols;		
		if(this.name=="while" || this.name=="for" || this.name=="if") {			
			console.log(this.condition);
			return eval(this.condition)==true;
		}
		return false;
	}
	
	this.run=function(symbols) {
		$__sym=symbols;
		if(this.name=="attr") {
			eval(`${this.args[0]}=${this.args[1]}`);
			return;
		}
		if(this.name=="read") {
			for(i in this.args) {				
				var name=this.args[i];							
				eval(`${name}=Number(window.prompt(name+"="))`);				
			}				
			return;
		}
		if(this.name=="write") {
			for(i in this.args) {				
				var name=this.args[i];							
				eval(`__builtin_write(${name})`);				
			}
		}		
	}
}

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function __builtin_read_int(msg) {
	return parseInt(window.prompt(msg,"0"));
}

function __builtin_write(msg) {
	consoleWrite(msg);	
	
	document.getElementById('CodeRes').style.display = 'none';
	document.getElementById('CodeRes').style.display = 'block';
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