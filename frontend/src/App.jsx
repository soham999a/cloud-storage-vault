��i m p o r t   {   B r o w s e r R o u t e r   a s   R o u t e r ,   R o u t e s ,   R o u t e   }   f r o m   ' r e a c t - r o u t e r - d o m ' ; 
 i m p o r t   N a v b a r   f r o m   ' . / c o m p o n e n t s / N a v b a r ' ; 
 i m p o r t   S i d e b a r   f r o m   ' . / c o m p o n e n t s / S i d e b a r ' ; 
 i m p o r t   L o g i n   f r o m   ' . / p a g e s / L o g i n ' ; 
 i m p o r t   R e g i s t e r   f r o m   ' . / p a g e s / R e g i s t e r ' ; 
 i m p o r t   D a s h b o a r d   f r o m   ' . / p a g e s / D a s h b o a r d ' ; 
 i m p o r t   D a s h b o a r d 3 D   f r o m   ' . / p a g e s / D a s h b o a r d 3 D ' ; 
 i m p o r t   U p l o a d   f r o m   ' . / p a g e s / U p l o a d ' ; 
 i m p o r t   P r o t e c t e d R o u t e   f r o m   ' . / c o m p o n e n t s / P r o t e c t e d R o u t e ' ; 
 i m p o r t   {   A u t h P r o v i d e r   }   f r o m   ' . / c o n t e x t s / A u t h C o n t e x t ' ; 
 i m p o r t   {   m o t i o n ,   A n i m a t e P r e s e n c e   }   f r o m   ' f r a m e r - m o t i o n ' ; 
 
 f u n c t i o n   A p p ( )   { 
     r e t u r n   ( 
         < A u t h P r o v i d e r > 
             < R o u t e r > 
                 < d i v   c l a s s N a m e = " m i n - h - s c r e e n   b g - b a c k g r o u n d " > 
                     < N a v b a r   / > 
                     < d i v   c l a s s N a m e = " f l e x " > 
                         < S i d e b a r   / > 
                         < m o t i o n . m a i n 
                             c l a s s N a m e = " f l e x - 1   p - 8 " 
                             i n i t i a l = { {   o p a c i t y :   0   } } 
                             a n i m a t e = { {   o p a c i t y :   1   } } 
                             t r a n s i t i o n = { {   d u r a t i o n :   0 . 5   } } 
                         > 
                             < A n i m a t e P r e s e n c e   m o d e = " w a i t " > 
                                 < R o u t e s > 
                                     { / *   P u b l i c   R o u t e s   * / } 
                                     < R o u t e   p a t h = " / l o g i n "   e l e m e n t = { < L o g i n   / > }   / > 
                                     < R o u t e   p a t h = " / r e g i s t e r "   e l e m e n t = { < R e g i s t e r   / > }   / > 
 
                                     { / *   P r o t e c t e d   R o u t e s   * / } 
                                     < R o u t e   e l e m e n t = { < P r o t e c t e d R o u t e   / > } > 
                                         < R o u t e   p a t h = " / "   e l e m e n t = { < D a s h b o a r d 3 D   / > }   / > 
                                         < R o u t e   p a t h = " / d a s h b o a r d "   e l e m e n t = { < D a s h b o a r d   / > }   / > 
                                         < R o u t e   p a t h = " / u p l o a d "   e l e m e n t = { < U p l o a d   / > }   / > 
                                     < / R o u t e > 
                                 < / R o u t e s > 
                             < / A n i m a t e P r e s e n c e > 
                         < / m o t i o n . m a i n > 
                     < / d i v > 
                 < / d i v > 
             < / R o u t e r > 
         < / A u t h P r o v i d e r > 
     ) ; 
 } 
 
 e x p o r t   d e f a u l t   A p p ; 
 