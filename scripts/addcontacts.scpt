FasdUAS 1.101.10   ��   ��    k             l     ��  ��      --- FUNCTIONS ---     � 	 	 $   - - -   F U N C T I O N S   - - -   
  
 l     ��  ��    ( " Define regex-like number function     �   D   D e f i n e   r e g e x - l i k e   n u m b e r   f u n c t i o n      i         I      �� ���� .0 returnnumbersinstring returnNumbersInString   ��  o      ���� 0 inputstring inputString��  ��    k     L       r         n         1    ��
�� 
strq  o     ���� 0 inputstring inputString  o      ���� 0 s        I   �� ��
�� .sysoexecTEXT���     TEXT  b    	     m     ! ! � " " 0 s e d   s / [ a - z A - Z \ ' ] / / g   < < <     o    ���� 0 s  ��     # $ # r     % & % l    '���� ' 1    ��
�� 
rslt��  ��   & o      ���� 0 dx   $  ( ) ( r     * + * J    ����   + o      ���� 0 numlist   )  , - , Y    I .�� / 0�� . k   ' D 1 1  2 3 2 r   ' - 4 5 4 n   ' + 6 7 6 4   ( +�� 8
�� 
cwor 8 o   ) *���� 0 i   7 o   ' (���� 0 dx   5 o      ���� 0 	this_item   3  9�� 9 Q   . D : ;�� : k   1 ; < <  = > = r   1 6 ? @ ? c   1 4 A B A o   1 2���� 0 	this_item   B m   2 3��
�� 
nmbr @ o      ���� 0 	this_item   >  C�� C r   7 ; D E D o   7 8���� 0 	this_item   E l      F���� F n       G H G  ;   9 : H o   8 9���� 0 numlist  ��  ��  ��   ; R      ������
�� .ascrerr ****      � ****��  ��  ��  ��  �� 0 i   / m    ����  0 I   "�� I��
�� .corecnte****       **** I n    J K J 2   ��
�� 
cwor K o    ���� 0 dx  ��  ��   -  L�� L L   J L M M o   J K���� 0 numlist  ��     N O N l     ��������  ��  ��   O  P Q P l     �� R S��   R   Define split function    S � T T ,   D e f i n e   s p l i t   f u n c t i o n Q  U V U i    W X W I      �� Y���� 	0 split   Y  Z [ Z o      ���� 0 sometext someText [  \�� \ o      ���� 0 	delimiter  ��  ��   X k      ] ]  ^ _ ^ r      ` a ` o     ���� 0 	delimiter   a n      b c b 1    ��
�� 
txdl c 1    ��
�� 
ascr _  d e d r     f g f n   	 h i h 2   	��
�� 
citm i o    ���� 0 sometext someText g o      ���� 0 sometext someText e  j k j l    l m n l r     o p o J     q q  r�� r m     s s � t t  ��   p n      u v u 1    ��
�� 
txdl v 1    ��
�� 
ascr m + %> restore delimiters to default value    n � w w J >   r e s t o r e   d e l i m i t e r s   t o   d e f a u l t   v a l u e k  x�� x L     y y o    ���� 0 sometext someText��   V  z { z l     ��������  ��  ��   {  | } | l     �� ~ ��   ~ * $ Define check contact exist function     � � � H   D e f i n e   c h e c k   c o n t a c t   e x i s t   f u n c t i o n }  � � � i     � � � I      �� ����� &0 checkcontactexist checkContactExist �  ��� � o      ���� 0 thefirstname theFirstName��  ��   � k     F � �  � � � r     , � � � J     * � �  � � � m     ����  �  � � � l    ����� � c     � � � n     � � � 7   �� � �
�� 
ctxt � m    ����  � m   	 ����  � o    ���� 0 thefirstname theFirstName � m    ��
�� 
nmbr��  ��   �  � � � l    ����� � c     � � � n     � � � 7   �� � �
�� 
ctxt � m    ����  � m    ����  � o    ���� 0 thefirstname theFirstName � m    ��
�� 
nmbr��  ��   �  ��� � l   ( ����� � c    ( � � � n    & � � � 7   &�� � �
�� 
ctxt � m     "����  � m   # %����  � o    ���� 0 thefirstname theFirstName � m   & '��
�� 
nmbr��  ��  ��   � o      ���� 0 myphone   �  ��� � O   - F � � � L   1 E � � n   1 D � � � 1   A C��
�� 
az17 � n   1 A � � � 4   > A�� �
�� 
az20 � m   ? @����  � l  1 > ����� � 6  1 > � � � 4 1 5�� �
�� 
azf4 � m   3 4����  � =  6 = � � � 1   7 9��
�� 
azf7 � m   : < � � � � �  G e o r g e��  ��   � m   - . � ��                                                                                  adrb  alis    J  Untitled                   ���H+   ���Contacts.app                                                    �����~        ����  	                Applications    ��"_      ����     ���  #Untitled:Applications: Contacts.app     C o n t a c t s . a p p    U n t i t l e d  Applications/Contacts.app   / ��  ��   �  � � � l     �� � ���   �   -----------    � � � �    - - - - - - - - - - - �  � � � l     ��������  ��  ��   �  � � � l     �� � ���   � ' ! Determine the input file's path.    � � � � B   D e t e r m i n e   t h e   i n p u t   f i l e ' s   p a t h . �  � � � l     ����� � r      � � � m      � � � � � ` / U s e r s / s a m k i r k i l e s / D e s k t o p / k e n t e a t s / c o n t a c t s . t x t � o      ���� 0 srcfile srcFile��  ��   �  � � � l     ��������  ��  ��   �  � � � l     �� � ���   �   Read lines from file.    � � � � ,   R e a d   l i n e s   f r o m   f i l e . �  � � � l    ����� � r     � � � n     � � � 2   ��
�� 
cpar � l    ����� � I   �� � �
�� .rdwrread****        **** � o    ���� 0 srcfile srcFile � �� ���
�� 
as   � m    ��
�� 
utf8��  ��  ��   � o      �� 0 lns  ��  ��   �  � � � l     �~�}�|�~  �}  �|   �  � � � l    ��{�z � I   �y ��x
�y .sysodisAaleR        TEXT � I    �w ��v�w &0 checkcontactexist checkContactExist �  ��u � m     � � � � �  1 8 4 5 4 6 4 9 8 8 0�u  �v  �x  �{  �z   �  � � � l     �t�s�r�t  �s  �r   �  � � � l     �q � ��q   � ; 5 Loop over lines read and copy each to the clipboard.    � � � � j   L o o p   o v e r   l i n e s   r e a d   a n d   c o p y   e a c h   t o   t h e   c l i p b o a r d . �  ��p � l   9 ��o�n � X    9 ��m � � r   + 4 � � � I   + 2�l ��k�l 	0 split   �  � � � o   , -�j�j 0 ln   �  ��i � m   - . � � � � �  ,�i  �k   � o      �h�h 
0 someln  �m 0 ln   � o    �g�g 0 lns  �o  �n  �p       �f � � � �f   � �e�d�c�b�e .0 returnnumbersinstring returnNumbersInString�d 	0 split  �c &0 checkcontactexist checkContactExist
�b .aevtoappnull  �   � **** � �a �`�_�^�a .0 returnnumbersinstring returnNumbersInString�` �]�]   �\�\ 0 inputstring inputString�_   �[�Z�Y�X�W�V�[ 0 inputstring inputString�Z 0 s  �Y 0 dx  �X 0 numlist  �W 0 i  �V 0 	this_item   	�U !�T�S�R�Q�P�O�N
�U 
strq
�T .sysoexecTEXT���     TEXT
�S 
rslt
�R 
cwor
�Q .corecnte****       ****
�P 
nmbr�O  �N  �^ M��,E�O�%j O�E�OjvE�O 1k��-j kh ��/E�O ��&E�O��6FW X  h[OY��O� � �M X�L�K�J�M 	0 split  �L �I�I   �H�G�H 0 sometext someText�G 0 	delimiter  �K   �F�E�F 0 sometext someText�E 0 	delimiter   �D�C�B s
�D 
ascr
�C 
txdl
�B 
citm�J ���,FO��-E�O�kv��,FO�  �A ��@�?	�>�A &0 checkcontactexist checkContactExist�@ �=
�= 
  �<�< 0 thefirstname theFirstName�?   �;�:�; 0 thefirstname theFirstName�: 0 myphone  	 �9�8�7�6�5�4�3 ��2�1 ��0�/
�9 
ctxt�8 
�7 
nmbr�6 �5 �4 �3 
�2 
azf4  
�1 
azf7
�0 
az20
�/ 
az17�> Gk�[�\[Zl\Z�2�&�[�\[Z�\Z�2�&�[�\[Z�\Z�2�&�vE�O� *�k/�[�,\Z�81�k/�,EU �.�-�,�+
�. .aevtoappnull  �   � **** k     9  �  �  �  ��*�*  �-  �,   �)�) 0 ln    ��(�'�&�%�$�# ��"�!� �� ����( 0 srcfile srcFile
�' 
as  
�& 
utf8
�% .rdwrread****        ****
�$ 
cpar�# 0 lns  �" &0 checkcontactexist checkContactExist
�! .sysodisAaleR        TEXT
�  
kocl
� 
cobj
� .corecnte****       ****� 	0 split  � 
0 someln  �+ :�E�O���l �-E�O*�k+ j 	O �[��l kh  *��l+ E�[OY��ascr  ��ޭ