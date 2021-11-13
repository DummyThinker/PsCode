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
	
	this.finals=finals;	
		
	console.log(this.finals);
	
	this.tree=new InstructionTree();
		
	var node = this.tree;
	var symbols = [];
	var i=0;
	while(i<finals.length){			
		var token=finals[i];
		
		if(token=="{") {						
			i++;
			continue;
		}		
		else if(token=="}") {
			node = node.parent;
			i++;
			continue;
		}
		else if(token=="read") {
			node = new InstructionTree(node);
			node.name="read";
			i++;			
			if(i<finals.length) {
				node.args.push(finals[i]);					
				i++;				
				while(i<finals.length && finals[i]==',') {					
					node.args.push(finals[i+1]);					
					i+=2;
				}				
				node=node.parent;
				continue;
			}			
		}
		else if(token=="write") {
			node = new InstructionTree(node);
			node.name="write";
			i++;			
			if(i<finals.length) {				
				node.args.push(finals[i]);
				i++;				
				while(i<finals.length && finals[i]==',') {					
					node.args.push(finals[i+1]);
					i+=2;
				}			
				node=node.parent;
				continue;
			}			
		}
		else if(token=="if" || token=="while") {
			node = new InstructionTree(node);
			node.name=token;
			node.condition="";			
			i++;			
			while(i<finals.length && finals[i]!="do" && finals[i]!="then" && finals[i]!="") {
				node.condition+=finals[i];
				i++;
			}			
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
			var nif=node.children[node.children.length-1];
			console.log(nif)
			if(nif.name!="if") {
				this.error="Excpected else after if.";
				return;
			}
			node=nif;			
			i++;
			continue;
		}
		else if(i<finals.length-1 && finals[i+1]=='=') {
			node = new InstructionTree(node);
			node.name="attr";
			rhand="";
			i+=2;
			while(i<finals.length-1 && finals[i]!="") {
				rhand+=finals[i];
				i++;
			}
			node.args.push(token);
			node.args.push(rhand);	
			node=node.parent;
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
			while(finals[i]!=",") {
				stop+=finals[i]; i++;
			}
			while(finals[i]!="{") {
				step+=finals[i]; i++;
			}
			node = new InstructionTree(node);
			node.name="for";
			node.args.push(it);
			node.args.push(start);
			node.args.push(stop);
			node.args.push(step);
		}
		else if(token=="") {
			i++;
			continue;
		}
		i++;
	}	
	
	console.log(this.tree);
	
	this.crt=null;	
	this.interval = null;
	
	this.execute = function() {
		var self=this;
		this.crt=this.tree;	
		var crt=this.crt;	
		var stack = [ this.tree ];
		this.interval = setInterval(function(){
			if (stack.length==0) {
				this.stop();
				return;
			}			
			var crt = stack[stack.length-1];
			//if(crt.
			
			
			console.log(crt.name);		
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
	
	this.next=function() {
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