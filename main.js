// from github by KaticNikola at 2024-04-05
// edit by msnbrest ( fix game_over and retry, mix sounds + ogg, sort code, better header + init, cursor paddle, add move when collision, to objs, help... )

// TODO prévoir position qui sera testee pour collision
// TODO lorsque touche coté brique, alors ch dx  collisionBallBricks

let imgs= {}, sons= {}, cvs, cxt, paddle, ball, brick, soundg, keybo, sys;



const _sel= sel=> document.querySelector(sel),



init= _=>{

// load imgs sounds
imgs.bg= new Image();   imgs.bg.src= "img/bg.jpg";
imgs.level= new Image();   imgs.level.src= "img/level.png";
imgs.life= new Image();   imgs.life.src= "img/life.png";
imgs.score= new Image();   imgs.score.src= "img/score.png";
sons.wall= { a:new Audio(), n:0 };   sons.wall.a.src= "sounds/wall.ogg";
sons.life= { a:new Audio(), n:0 };   sons.life.a.src= "sounds/life_lost.ogg";
sons.paddle= { a:new Audio(), n:0 };   sons.paddle.a.src= "sounds/paddle_hit1.mp3";
sons.win= { a:new Audio(), n:0 };   sons.win.a.src= "sounds/win.ogg";
sons.brick= { a:new Audio(), n:0 };   sons.brick.a.src= "sounds/brick_hit.mp3";



// set draw zone
cvs= _sel("#game");

cxt= cvs.getContext('2d');

cvs.style.border= '1px solid #0ff';
cxt.lineWidth= 2; // paddle border 



// actions buttons & mouse
soundg= {   btn: _sel('#soundBtn'),   is: true   };

soundg.btn.addEventListener('click', osef=>{
	soundg.is= !soundg.is;
	soundg.btn.setAttribute('src', soundg.is ? "img/SOUND_ON.png" : "img/SOUND_OFF.png" );
	sons.forEach( son=>{ son.muted= !soundg.is; } );
});

_sel(".table").addEventListener('click', e=>{ sys.game_over &&(   retry(true,event)   ); });

document.addEventListener("keydown", e=>{
	e.keyCode == 37 &&( keybo.left= true );
	e.keyCode == 39 &&( keybo.right= true );
	e.keyCode == 96 && sys.game_over &&(   retry(true,null)   );
});

document.addEventListener("keyup", e=>{
	e.keyCode == 37 &&( keybo.left= false );
	e.keyCode == 39 &&( keybo.right= false);
});

document.addEventListener("mousemove", mousemoved);

retry(false,null);

},



mousemoved= event=>{ paddle.x= Math.max( 0, Math.min( event.clientX-cvs.offsetLeft-paddle.width/2, cvs.width-paddle.width ) ); },



drawBall= _=>{
	cxt.beginPath();

	cxt.arc(ball.x, ball.y, ball.radius-2, 0, Math.PI * 2);
	cxt.fillStyle= '#ffcd05';
	cxt.fill();
	cxt.strokeStyle= '#2e3548';
	cxt.stroke();

	cxt.closePath();
},



drawPaddle= _=>{
	cxt.fillStyle= '#2e3548';
	cxt.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
	cxt.strokeStyle= '#ffcd05';
	cxt.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
},



drawBricks= _=>{
	for (let r= 0; r < brick.row; r++) {
		for (let c= 0; c < brick.columns; c++) {
			let b= sys.bricks[r][c];//loop created brics
			if (b.status) {
				cxt.fillStyle= brick.fillColor;
				cxt.fillRect(
					b.x, b.y,//from loopCreated brick  
					brick.width, brick.height);

				cxt.strokeStyle= brick.strokeColor;
				cxt.strokeRect(
					b.x, b.y,//from loopCreated brick  
					brick.width, brick.height);
			}
		}
	}
},



showGameStats= (txt, txtX, txtY, img, imgX, imgY)=>{
	//text
	cxt.fillStyle= 'fff';
	cxt.font= '25px Germania One';
	cxt.fillText(txt, txtX, txtY);

	//image
	cxt.drawImage(img, imgX, imgY, width= 25, height= 25)
},



movePaddle= _=>{
	if (keybo.right && paddle.x + paddle.width < cvs.width) {
		paddle.x += paddle.vx;
	} else if (keybo.left && paddle.x > 0) {
		paddle.x -= paddle.vx;
	}
},



moveBall= _=>{
	ball.x+= ball.dx;
	ball.y+= ball.dy;
	ball.px= ball.x + ball.dx;
	ball.py= ball.y + ball.dy;
},



ball_new_dir= ( inv_dx, inv_dy, new_dx=null, new_dy=null )=>{

	inv_dx &&( ball.dx= -ball.dx);
	inv_dy &&( ball.dy= -ball.dy);
	new_dx==null ||( ball.dx= new_dx );
	new_dy==null ||( ball.dy= new_dy );

	ball.px= ball.x + ball.dx;
	ball.py= ball.y + ball.dy;
},



collisionBallWall= _=>{
	if( ball.px - ball.radius < 0 ){
		ball_new_dir( false, false, Math.abs(ball.dx), ball.dy );
		sons.wall.n++;
	}
	if( ball.px + ball.radius > cvs.width ){
		ball_new_dir( false, false, -Math.abs(ball.dx), ball.dy );
		sons.wall.n++;
	}
	if( ball.py - ball.radius < 0 ){
		ball_new_dir( false, false, ball.dx, Math.abs(ball.dy) );
		sons.wall.n++;
	}
	if( ball.py + ball.radius > cvs.height ){
		sons.life.n++;
		sys.life--;
		resetBall();
	}
},



collisionBallPaddle= _=>{
	if( ball.px - ball.radius < paddle.x + paddle.width &&
		ball.px + ball.radius > paddle.x &&
		ball.py - ball.radius < paddle.y + paddle.height &&
		ball.py + ball.radius > paddle.y ){
		sons.paddle.n++
		let impact_angle= ( ( ball.px - (paddle.x + paddle.width / 2) ) / (paddle.width / 2) ) * Math.PI / 3 //60deg
		ball_new_dir( false, false, Math.sin(impact_angle) * ball.speed, -Math.cos(impact_angle) * ball.speed );
	}
},



collisionBallBricks= _=>{
	let b;
	for (let r= 0; r < brick.row; r++) {
		for (let c= 0; c < brick.columns; c++) {
			is_strike_brick( sys.bricks[r][c] )
		}
	}
},



is_strike_brick= b=>{
	if( !b.status ){ return; }

	if(
		ball.px + ball.radius > b.x &&
		ball.px - ball.radius < b.x + brick.width &&
		ball.py + ball.radius > b.y &&
		ball.py - ball.radius < b.y + brick.height
	){
		sons.brick.n++;
		if( ball.x + ball.radius <= b.x ){ ball_new_dir( false, false, -Math.abs(ball.dx), ball.dy ); }
		if( ball.x - ball.radius >= b.x + brick.width ){ ball_new_dir( false, false, Math.abs(ball.dx), ball.dy ); }
		if( ball.y + ball.radius <= b.y ){ ball_new_dir( false, false, ball.dx, -Math.abs(ball.dy) ); }
		if( ball.y - ball.radius >= b.y + brick.height ){ ball_new_dir( false, false, ball.dx, Math.abs(ball.dy) ); }

		b.status= false;
		sys.score ++;
	}
},



levelUp= _=>{
	let isLevelDone= true;

	//are all bricks broken
	for (let r= 0; r < brick.row; r++) {
		for (let c= 0; c < brick.columns; c++) {
			isLevelDone= isLevelDone && !sys.bricks[r][c].status
		}
	}
	if (isLevelDone) {
		sons.win.n++;
		if( sys.level > sys.max_level ){
			sys.game_over= true;
			return;
		}
		brick.row++;
		createBricks();
		ball.speed+= 0.25;   resetBall();
		sys.level++;
		if( sys.life<3 ){ sys.life= 3; }   sys.life++;
	}
},



createBricks= _=>{
	for (let r= 0; r < brick.row; r++) {
		sys.bricks[r]= []//create row
		for (let c= 0; c < brick.columns; c++) {
			sys.bricks[r][c]= { //individual brick
				x: c * (brick.offsetLeft + brick.width) + brick.offsetLeft,
				y: r * (brick.offsetTop + brick.height) + brick.offsetTop + brick.marginTop,
				status: true
			}
		}
	}

},



resetBall= _=>{
	ball.x= paddle.x + paddle.width/2;
	ball.y= paddle.y - ball.radius;
	ball_new_dir( false, false, 0, -ball.speed*.8 ); // friendly start speed
},



retry= (lezgo,event)=>{

	keybo= { left: false, right: false };
	sys= { life: 3, score: 0, level: 0, max_level: 5, game_over: true, bricks: [], fps8: 0 };



	paddle= {
		x: null,
		y: null,
		width: 100,
		height: 20,

		vx: 5, //define movement 
	};
	if( event ){
		mousemoved(event);
	}else{
		paddle.x= cvs.width / 2 - paddle.width / 2 + 0.1;
	}
	paddle.y= cvs.height - paddle.height - 10;



	ball= {
		x: null,
		y: null,
		radius: 11,
		speed: 6,
		px: null,
		py: null,
	};
	resetBall();



	brick= {
		row: 2,
		columns: 8,
		width: 55,
		height: 20,
		offsetLeft: 10,
		offsetTop: 10,
		marginTop: 40,
		fillColor: "#2e3548",
		strokeColor: "#fff",
	};

	createBricks();

	if( lezgo ){
		_sel(".help") &&( _sel(".help").innerHTML= "" );
		sys.game_over= false;
		loop(true);
	}else{
		loop(false);
	}
},



goplay= son=>{   son.n>0 &&(   son.a.currentTime= 0,   son.a.play(),   son.n--   );   },



tick_fps8= _=>{

	goplay(sons.wall);
	goplay(sons.life);
	goplay(sons.paddle);
	goplay(sons.win);
	goplay(sons.brick);
},



loop= more=>{

	cxt.drawImage(imgs.bg, 0, 0, cvs.width, cvs.height);
	drawBall();
	drawPaddle();
	drawBricks();

	showGameStats(sys.score, 35, 25, imgs.score, 5, 5);
	showGameStats(sys.life, cvs.width - 25, 25, imgs.life, cvs.width - 55, 5);
	showGameStats(sys.level+1, cvs.width / 2, 25, imgs.level, cvs.width / 2 - 30, 5);

	movePaddle();
	moveBall();
	collisionBallWall();
	collisionBallPaddle();
	collisionBallBricks();

	levelUp();
	sys.fps8++;   if( sys.fps8>7 ){   tick_fps8();   sys.fps8= 0;   }

	(sys.life < 0)&&( sys.game_over= true, _sel(".help").innerHTML= "End of Game.<br><br>Click to replay" );

	sys.game_over ||( more &&( requestAnimationFrame(loop) ) );
};
